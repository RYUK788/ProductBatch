import React, { useEffect, useState } from 'react';
import {
  Col,
  Row,
  Button as AntButton,
  DatePicker,
  notification,
  Form,
  Input,
  Select,
  message, // Added message
  ConfigProvider,
} from 'antd';
import moment from 'moment';

const { Option } = Select;

// Added SupersetClient import
import { SupersetClient } from '@superset-ui/core';

// Mock function to simulate fetching data from a backend
const fetchDailyTotals = async (date) => {
  console.log(`Fetching totals for ${date.format('YYYY-MM-DD')}`);
  // In a real app, this would be an API call.
  // For demonstration, we'll return some mock data.
  return Promise.resolve({
    totalWdgs: 125.50, // Mocked total for the day
    totalDdgs: 250.75, // Mocked total for the day
  });
};

const SectionHeader = ({ title }) => (
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

const defaultFormValues = {
  productionDate: moment(),
  timeOfDay: 'AM',
  tankNumber: 'LI_8422_PV', // Modified default value
  isCertified: 'Yes',
  beerFeedRate: '590',
  cornBu: '0.00',
  beerFeedAdjustment: '1.00',
  wdgsTons: '0.00',
  ddgsTons: '0.00',
};

function ProductionBatchForm(props) {
  const [form] = Form.useForm();
  const [totalWdgs, setTotalWdgs] = useState('0.00');
  const [totalDdgs, setTotalDdgs] = useState('0.00');
  const productionDate = Form.useWatch('productionDate', form);

  const openNotification = (placement) => {
    notification.success({
      message: `Production Batch Data saved successfully`,
      placement,
    });
  };

  const handleValuesChange = (changedValues, allValues) => {
    const numEthanolVol = parseFloat(allValues.ethanolVol) || 0;
    const numBeerFeedRate = parseFloat(allValues.beerFeedRate) || 0;
    const numHours = parseFloat(allValues.hoursOfProduction) || 0;
    const numWdgsProd = parseFloat(allValues.wdgsProdTonHr) || 0;
    const numWdgsMoisture = parseFloat(allValues.wdgsAvgMoisture) || 0;
    const numDdgsProd = parseFloat(allValues.ddgsProdTonHr) || 0;
    const numDdgsMoisture = parseFloat(allValues.ddgsAvgMoisture) || 0;

    const calculatedCorn = numEthanolVol / 3;
    const calculatedAdjustment = numBeerFeedRate === 590 ? 1 : numBeerFeedRate / 590;
    const calculatedWdgs = numWdgsProd * numHours * calculatedAdjustment;
    let calculatedDdgs = 0;
    if (100 - numDdgsMoisture !== 0) {
      calculatedDdgs =
        ((((100 - numWdgsMoisture) * numDdgsProd) / (100 - numDdgsMoisture)) * numHours) * calculatedAdjustment;
    }

    form.setFieldsValue({
      cornBu: calculatedCorn.toFixed(2),
      beerFeedAdjustment: calculatedAdjustment.toFixed(2),
      wdgsTons: calculatedWdgs.toFixed(2),
      ddgsTons: calculatedDdgs.toFixed(2),
    });
  };

  const newForm = () => {
    form.resetFields();
    form.setFieldsValue({
      ...defaultFormValues,
      productionDate: moment(),
    });
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

  // New handleFetchData function
  const handleFetchData = async () => {
    try {
        const tankTag = form.getFieldValue('tankNumber');
        if (!tankTag) {
            message.warning('Please select a Tank Number first.');
            return;
        }

        // Tags for the first table
        const plc1Tags = [
            tankTag, // e.g., 'LI_8422_PV'
            'FIC_8403_PV', // Undenatured Ethanol
            'SC_6617_Out', // Trim Speed
        ];

        // Tag for the second table
        const plc5Tags = ['FIC_3513_PV']; // Beer Feed Rate

        const plc1Response = await SupersetClient.post({
            endpoint: '/api/v1/ethanol-transfer/dcs-data',
            jsonPayload: { columns: plc1Tags, table: 'plc_data_1_pm1' },
        });

        const plc5Response = await SupersetClient.post({
            endpoint: '/api/v1/ethanol-transfer/dcs-data',
            jsonPayload: { columns: plc5Tags, table: 'plc_data_5_pm1' },
        });

        if (plc1Response.json.error || plc5Response.json.error) {
            throw new Error(plc1Response.json.error || plc5Response.json.error);
        }

        const values = {
            ...plc1Response.json.values,
            ...plc5Response.json.values,
        };

        form.setFieldsValue({
            ethanolVol: values['FIC_8403_PV'],
            beerFeedRate: values['FIC_3513_PV'],
            trimSpeeds: values['SC_6617_Out'],
        });

        message.success('Live data fetched successfully!');

    } catch (error) {
        console.error('Failed to fetch live data:', error);
        message.error('Failed to fetch live data: ' + error.message);
    }
};


  useEffect(() => {
    const dateToFetch = productionDate || moment();
    fetchDailyTotals(dateToFetch).then(data => {
      setTotalWdgs(data.totalWdgs.toFixed(2));
      setTotalDdgs(data.totalDdgs.toFixed(2));
    });
  }, [productionDate]);

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
            <h1 style={{ textAlign: "center",marginTop: "54px", marginBottom: "24px" }}>Product Batch Form</h1>

            <SectionHeader title="Batch Details" />
            <Row gutter={24}>
              <Col span={12}><Form.Item label="Date*" name="productionDate"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}><Form.Item label="Time of Day*" name="timeOfDay"><Select><Option value="AM">AM</Option><Option value="PM">PM</Option></Select></Form.Item></Col>
              <Col span={12}><Form.Item label="Tank Number*" name="tankNumber"><Select><Option value="LI_8422_PV">8422</Option><Option value="LI_8433_PV">8433</Option></Select></Form.Item></Col> {/* Modified */}
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
              <Col span={12}><Form.Item label="Total WDGS (tons)"><Input value={totalWdgs} readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></Col>
              <Col span={12}><Form.Item label="Total DDGS (tons)"><Input value={totalDdgs} readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></Col>
            </Row>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
              <AntButton type="default" size="large" onClick={newForm} style={{ backgroundColor: "#454E7C", color: "white" }}>New</AntButton>
              <div>
                <AntButton type="default" size="large" style={{ marginRight: 8, backgroundColor: "#454E7C", color: "white" }} onClick={handleClose}>Close</AntButton>
                <AntButton type="default" size="large" style={{ marginRight: 8, backgroundColor: "#454E7C", color: "white" }} onClick={handleFetchData}>Fetch Live Data</AntButton> {/* Added */}
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
