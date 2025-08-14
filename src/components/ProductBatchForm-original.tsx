import React, { useEffect } from 'react';
import {
  Col,
  Row,
  Button as AntButton,
  DatePicker,
  notification,
  Form,
  Input,
  Select,
  ConfigProvider,
  notification as AntNotification,
} from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import moment from 'moment';
import type { Moment } from 'moment';

const { Option } = Select;

// Mock function to simulate fetching data from a backend
const fetchDailyTotals = async (date: Moment) => {
  console.log(`Fetching totals for ${date.format('YYYY-MM-DD')}`);
  // In a real app, this would be an API call.
  return Promise.resolve({
    totalWdgs: 125.50,
    totalDdgs: 250.75,
  });
};

const SectionHeader = ({ title }: { title: string }) => (
  <div
    style={{
      backgroundColor: "#6c757d",
      color: "white",
      padding: "8px 16px",
      textAlign: "center",
      fontWeight: 500,
      margin: "24px 0 16px 0",
      borderRadius: "4px",
    }}
  >
    {title.toUpperCase()}
  </div>
);

// --- CHANGE ---
// Added dailyTotal fields to the form's type definition
interface ProductionBatchFormValues {
  productionDate: Moment;
  timeOfDay: string;
  tankNumber: number;
  numTransfers?: string;
  isCertified: string;
  ethanolVol?: string;
  beerFeedRate?: string;
  trimSpeeds?: string;
  hoursOfProduction?: string;
  wdgsProdTonHr?: string;
  wdgsAvgMoisture?: string;
  ddgsProdTonHr?: string;
  ddgsAvgMoisture?: string;
  cornBu: string;
  beerFeedAdjustment: string;
  wdgsTons: string;
  ddgsTons: string;
  dailyTotalWdgs: string; // New field
  dailyTotalDdgs: string; // New field
}

// Added dailyTotal fields to the default values
const defaultFormValues: Partial<ProductionBatchFormValues> = {
  productionDate: moment(),
  timeOfDay: 'AM',
  tankNumber: 8422,
  isCertified: 'Yes',
  beerFeedRate: '590',
  cornBu: '0.00',
  beerFeedAdjustment: '1.00',
  wdgsTons: '0.00',
  ddgsTons: '0.00',
  dailyTotalWdgs: '0.00',
  dailyTotalDdgs: '0.00',
};


interface ProductionBatchFormProps {
  closeForm?: () => void;
}

function ProductionBatchForm(props: ProductionBatchFormProps) {
  const [form] = Form.useForm<ProductionBatchFormValues>();
  const productionDate = Form.useWatch('productionDate', form);

  // --- CHANGE ---
  // Removed the separate useState for totalWdgs and totalDdgs

  const openNotification = (placement: NotificationPlacement) => {
    AntNotification.success({
      message: `Production Batch Data saved successfully`,
      placement,
    });
  };

  const handleValuesChange = (_: Partial<ProductionBatchFormValues>, allValues: ProductionBatchFormValues) => {
    // This calculation logic remains the same
    const numEthanolVol = parseFloat(allValues.ethanolVol || '0');
    const numBeerFeedRate = parseFloat(allValues.beerFeedRate || '0');
    const numHours = parseFloat(allValues.hoursOfProduction || '0');
    const numWdgsProd = parseFloat(allValues.wdgsProdTonHr || '0');
    const numWdgsMoisture = parseFloat(allValues.wdgsAvgMoisture || '0');
    const numDdgsProd = parseFloat(allValues.ddgsProdTonHr || '0');
    const numDdgsMoisture = parseFloat(allValues.ddgsAvgMoisture || '0');

    const calculatedCorn = numEthanolVol / 3;
    const calculatedAdjustment = numBeerFeedRate === 590 ? 1 : numBeerFeedRate / 590;
    const calculatedWdgs = numWdgsProd * numHours * calculatedAdjustment;
    let calculatedDdgs = 0;
    if (100 - numDdgsMoisture !== 0) {
      calculatedDdgs = ((((100 - numWdgsMoisture) * numDdgsProd) / (100 - numDdgsMoisture)) * numHours) * calculatedAdjustment;
    }

    form.setFieldsValue({
      cornBu: calculatedCorn.toFixed(2),
      beerFeedAdjustment: calculatedAdjustment.toFixed(2),
      wdgsTons: calculatedWdgs.toFixed(2),
      ddgsTons: calculatedDdgs.toFixed(2),
    });
  };

  const newForm = () => {
    form.resetFields(); // Resets to initialValues, which now includes the daily totals
  };

  const onSubmitForm = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submitting to product_batch table:', values);
      openNotification('bottomRight');
      newForm();
    } catch (error) {
      console.log('Validation Failed:', error);
    }
  };
  
  const handleClose = () => {
    if (props.closeForm) {
      props.closeForm();
    } else {
      console.log('close');
    }
  };

  useEffect(() => {
    // The trigger logic using useWatch is correct.
    // We just need to change *what* it does.
    if (productionDate) {
      fetchDailyTotals(productionDate).then(data => {
        // --- CHANGE ---
        // Update the form instance directly instead of separate state
        form.setFieldsValue({
          dailyTotalWdgs: data.totalWdgs.toFixed(2),
          dailyTotalDdgs: data.totalDdgs.toFixed(2),
        });
      });
    }
  }, [productionDate, form]); // form is a stable dependency, added for exhaustive-deps rule

  return (
    <ConfigProvider>
      <div style={{ padding: "24px", backgroundColor: "white", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", backgroundColor: "white", padding: "24px", borderRadius: "8px", boxShadow: "none" }}>
          <Form
            form={form}
            layout="horizontal"
            labelCol={{ span: 10 }}
            wrapperCol={{ span: 14 }}
            onValuesChange={handleValuesChange}
            initialValues={defaultFormValues}
          >
            <h1 style={{ textAlign: "center", marginTop: "54px", marginBottom: "24px" }}>Product Batch Form</h1>

            <SectionHeader title="Batch Details" />
            <Row gutter={24}>
                <Col span={12}><Form.Item label="Date*" name="productionDate"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Time of Day*" name="timeOfDay"><Select><Option value="AM">AM</Option><Option value="PM">PM</Option></Select></Form.Item></Col>
                <Col span={12}><Form.Item label="Tank Number*" name="tankNumber"><Select><Option value={8422}>8422</Option><Option value={8433}>8433</Option></Select></Form.Item></Col>
                <Col span={12}><Form.Item label="Number of Transfers*" name="numTransfers"><Input type="number" /></Form.Item></Col>
                <Col span={12}><Form.Item label="Certification*" name="isCertified"><Select><Option value="Yes">Yes</Option><Option value="No">No</Option></Select></Form.Item></Col>
            </Row>

            <SectionHeader title="Production Inputs & Parameters" />
            <Row gutter={24}>
                <Col span={12}><Form.Item label="Undenatured Ethanol Net Vol (gal)*" name="ethanolVol"><Input type="number" step="any" /></Form.Item></Col>
                <Col span={12}><Form.Item label="Beer Feed Rate*" name="beerFeedRate"><Input type="number" step="any" /></Form.Item></Col>
                <Col span={12}><Form.Item label="Trim Speeds*" name="trimSpeeds"><Input type="number" step="any" /></Form.Item></Col>
                <Col span={12}><Form.Item label="Hours of Production*" name="hoursOfProduction"><Input type="number" step="any" /></Form.Item></Col>
                <Col span={12}><Form.Item label="WDGS Production (tons/hour)*" name="wdgsProdTonHr"><Input type="number" step="any" /></Form.Item></Col>
                <Col span={12}><Form.Item label="WDGS Avg % Moisture*" name="wdgsAvgMoisture"><Input type="number" step="any" /></Form.Item></Col>
                <Col span={12}><Form.Item label="DDGS Production (tons/hour)*" name="ddgsProdTonHr"><Input type="number" step="any" /></Form.Item></Col>
                <Col span={12}><Form.Item label="DDGS Avg % Moisture*" name="ddgsAvgMoisture"><Input type="number" step="any" /></Form.Item></Col>
            </Row>

            <SectionHeader title="Calculated Values" />
            <Row gutter={24}>
                <Col span={12}><Form.Item label="Corn (bu)" name="cornBu"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Beer Feed Adjustment" name="beerFeedAdjustment"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></Col>
                <Col span={12}><Form.Item label="WDGS (tons)" name="wdgsTons"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></Col>
                <Col span={12}><Form.Item label="DDGS (tons)" name="ddgsTons"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></Col>
            </Row>

            <SectionHeader title="Daily Totals" />
            <Row gutter={24}>
                {/* --- CHANGE --- */}
                {/* Added `name` prop and removed `value` prop */}
                <Col span={12}><Form.Item label="Total WDGS (tons)" name="dailyTotalWdgs"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Total DDGS (tons)" name="dailyTotalDdgs"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></Col>
            </Row>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
              <AntButton type="default" size="large" onClick={newForm} style={{ backgroundColor: "#454E7C", color: "white" }}>New</AntButton>
              <div>
                <AntButton type="default" size="large" style={{ marginRight: 8, backgroundColor: "#454E7C", color: "white" }} onClick={handleClose}>Close</AntButton>
                <AntButton type="primary" size="large" onClick={onSubmitForm} style={{ backgroundColor: "#454E7C", borderColor: "#454E7C" }}>Submit Batch Data</AntButton>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default ProductionBatchForm;