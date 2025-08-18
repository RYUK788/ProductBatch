import React, { useEffect, useState } from 'react';
import {
  Button as AntButton,
  DatePicker,
  Form,
  Input,
  Select,
  ConfigProvider,
  notification as AntNotification,
  Table,
} from 'antd';
import moment from 'moment';
import styled, { createGlobalStyle } from 'styled-components';
import { ReloadOutlined, CheckOutlined } from '@ant-design/icons'; // CHANGED


const { Option } = Select;

const t = (s) => s;


// --- Styled Components (No Changes Here) ---
const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch; /* or center */
  max-width: 1200px;
  margin: 120 auto;
  /* Remove or reduce padding-top */
  padding-top: 8px;  /* Less padding for better view */
  box-sizing: border-box;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0 auto;
`;

const SectionTitle = styled.h3`
  font-size: 24px;
  margin-top: 24px;
  margin-bottom: 16px;
  margin-left: 16px;
  text-align: left;
  color: #000000ff;
`;

const SubSectionTitle = styled.h4`
  margin-bottom: 12px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
`;

const CalculationBox = styled.div`
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
  gap: 8px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
`;

const MathOperator = styled.span`
  font-size: 24px;
  color: #888;
  padding: 4px;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 500;
  color: #454e7c;
`;

const SectionContainer = styled.div`
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-top: 16px;
  background: white;
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
`;

const GlobalStyle = createGlobalStyle`
  .ant-form-item {
    margin-bottom: 8px !important;
  }
`;
// --- End of Styled Components ---


const formProps = {
    labelAlign: 'left',
    labelWrap: true,
    labelCol: {
        style: {
            height: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.2',
            fontSize: '26px',
        },
        span: 12,
    },
    wrapperCol: { span: 16 },
    colon: false,
    scrollToFirstError: true,
    layout: 'horizontal',
    validateTrigger: ['onChange', 'onBlur'],
};


// --- Mock Data and API Calls ---

const mockOccurrenceRecords = [
    { key: 'ETH-001', id: 'ETH-001', date: '2025-08-12', volume: 1200, isCertified: true },
    { key: 'ETH-002', id: 'ETH-002', date: '2025-08-13', volume: 950, isCertified: false },
    { key: 'ETH-003', id: 'ETH-003', date: '2025-08-14', volume: 1180, isCertified: true },
    { key: 'ETH-004', id: 'ETH-004', date: '2025-08-14', volume: 750, isCertified: false },
    { key: 'ETH-005', id: 'ETH-005', date: '2025-08-15', volume: 1500, isCertified: true },
];

const fetchDailyTotals = async (date) => {
  console.log(`Fetching totals for ${date.format('YYYY-MM-DD')}`);
  return Promise.resolve({
    totalWdgs: 125.50,
    totalDdgs: 250.75,
  });
};

const defaultFormValues = {
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


// --- Main Component ---

function ProductionBatchForm(props) {
  const [form] = Form.useForm();
  const productionDate = Form.useWatch('productionDate', form);

  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    setAllRecords(mockOccurrenceRecords);
  }, []);

  useEffect(() => {
    if (productionDate && allRecords.length > 0) {
      const formattedDate = productionDate.format('YYYY-MM-DD');
      const recordsForDay = allRecords.filter(record => record.date === formattedDate);
      setFilteredRecords(recordsForDay);
      setSelectedRowKeys([]);
    } else {
        setFilteredRecords([]);
    }
  }, [productionDate, allRecords]);


  const openNotification = (placement, message) => {
    AntNotification.success({
      message,
      placement,
    });
  };

  const handleValuesChange = (changedValues, allValues) => {
  // If the user is editing a calculated field, don't overwrite
  if (
    'cornBu' in changedValues ||
    'beerFeedAdjustment' in changedValues ||
    'wdgsTons' in changedValues ||
    'ddgsTons' in changedValues
  ) {
    return; // let user override manually
  }

  // Parse necessary input (source) fields
  const numEthanolVol = parseFloat(allValues.ethanolVol || '0');
  const numBeerFeedRate = parseFloat(allValues.beerFeedRate || '0');
  const numHours = parseFloat(allValues.hoursOfProduction || '0');
  const numWdgsProd = parseFloat(allValues.wdgsProdTonHr || '0');
  const numWdgsMoisture = parseFloat(allValues.wdgsAvgMoisture || '0');
  const numDdgsProd = parseFloat(allValues.ddgsProdTonHr || '0');
  const numDdgsMoisture = parseFloat(allValues.ddgsAvgMoisture || '0');

  // Business logic for derived values
  const calculatedCorn = numEthanolVol / 3;
  const calculatedAdjustment =
    numBeerFeedRate === 590 ? 1 : numBeerFeedRate / 590;
  const calculatedWdgs = numWdgsProd * numHours * calculatedAdjustment;

  let calculatedDdgs = 0;
  if (100 - numDdgsMoisture !== 0) {
    calculatedDdgs =
      (((100 - numWdgsMoisture) * numDdgsProd) /
        (100 - numDdgsMoisture)) *
      numHours *
      calculatedAdjustment;
  }

  // Auto-fill calculated fields (only when NOT manually edited by user)
  form.setFieldsValue({
    cornBu: calculatedCorn.toFixed(2),
    beerFeedAdjustment: calculatedAdjustment.toFixed(2),
    wdgsTons: calculatedWdgs.toFixed(2),
    ddgsTons: calculatedDdgs.toFixed(2),
  });
};


  const newForm = () => {
    form.resetFields();
  };

  const onSubmitForm = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submitting to product_batch table:', values);
      openNotification('bottomRight', 'Production Batch Data saved successfully');
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
    if (productionDate) {
      fetchDailyTotals(productionDate).then(data => {
        form.setFieldsValue({
          dailyTotalWdgs: data.totalWdgs.toFixed(2),
          dailyTotalDdgs: data.totalDdgs.toFixed(2),
        });
      });
    }
  }, [productionDate, form]);

  // --- Table Logic ---

  // REMOVED: Unused handler function
  // const handleCertificationChange = (key, isChecked) => { ... };

  // CHANGED: The 'render' function for 'isCertified' now returns a display-only icon
  const tableColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Volume (Liters)', dataIndex: 'volume', key: 'volume' },
    {
      title: 'Is Certified',
      dataIndex: 'isCertified',
      key: 'isCertified',
      align: 'center',
      render: (isCertified) =>
        isCertified ? <CheckOutlined style={{ color: '#454E7C', fontSize: '18px' }} /> : null,
    },
  ];

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleSubmitCertified = () => {
    console.log('Submitting Certified Records:', selectedRowKeys);
    openNotification('bottomRight', `Submitted ${selectedRowKeys.length} certified records.`);
    setSelectedRowKeys([]);
  };

  return (
    <StyledForm>
      <GlobalStyle />
      <FormContainer>
        <Form
          form={form}
          {...formProps}
          onValuesChange={handleValuesChange}
          initialValues={defaultFormValues}
        >
          <SectionContainer>
            <SectionTitle>{t('Batch Details')}</SectionTitle>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ width: 'calc(50% - 8px)' }}>
                  <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Date')}</>} name="productionDate"><DatePicker style={{ width: '100%' }} /></Form.Item>
                </div>
                <div style={{ width: 'calc(50% - 8px)' }}>
                  <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Time of Day')}</>} name="timeOfDay"><Select><Option value="AM">AM</Option><Option value="PM">PM</Option></Select></Form.Item>
                </div>
                <div style={{ width: 'calc(50% - 8px)' }}>
                  <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Tank Number')}</>} name="tankNumber"><Select><Option value={8422}>8422</Option><Option value={8433}>8433</Option></Select></Form.Item>
                </div>
                <div style={{ width: 'calc(50% - 8px)' }}>
                  <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Number of Transfers')}</>} name="numTransfers"><Input type="number" /></Form.Item>
                </div>
                <div style={{ width: 'calc(50% - 8px)' }}>
                  <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Certification')}</>} name="isCertified"><Select><Option value="Yes">Yes</Option><Option value="No">No</Option></Select></Form.Item>
                </div>
              </div>

              <SubSectionTitle style={{ marginTop: '24px' }}>{t('Ethanol Occurrence Records')}</SubSectionTitle>
              <Table
                rowSelection={rowSelection}
                columns={tableColumns}
                dataSource={filteredRecords}
                pagination={false}
                bordered
              />
              <AntButton
                onClick={handleSubmitCertified}
                disabled={selectedRowKeys.length === 0}
                style={{ marginTop: '16px' }}
              >
                Submit Certified Records
              </AntButton>
            </div>
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>{t('Production Inputs & Parameters')}</SectionTitle>
            <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Undenatured Ethanol Net Vol (gal)')}</>} name="ethanolVol"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Beer Feed Rate')}</>} name="beerFeedRate"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Trim Speeds')}</>} name="trimSpeeds"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Hours of Production')}</>} name="hoursOfProduction"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('WDGS Production (tons/hour)')}</>} name="wdgsProdTonHr"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('WDGS Avg % Moisture')}</>} name="wdgsAvgMoisture"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('DDGS Production (tons/hour)')}</>} name="ddgsProdTonHr"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('DDGS Avg % Moisture')}</>} name="ddgsAvgMoisture"><Input type="number" step="any" /></Form.Item>
              </div>
            </div>
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>{t('Calculated Values')}</SectionTitle>
            <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={t('Corn (bu)')} name="cornBu"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={t('Beer Feed Adjustment')} name="beerFeedAdjustment"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={t('WDGS (tons)')} name="wdgsTons"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={t('DDGS (tons)')} name="ddgsTons"><Input type="number" step="any" /></Form.Item>
              </div>
            </div>
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>{t('Daily Totals')}</SectionTitle>
            <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={t('Total WDGS (tons)')} name="dailyTotalWdgs"><Input type="number" step="any" /></Form.Item>
              </div>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item label={t('Total DDGS (tons)')} name="dailyTotalDdgs"><Input type="number" step="any" /></Form.Item>
              </div>
            </div>
          </SectionContainer>

          <ButtonContainer>
            <AntButton type="default" size="large" onClick={newForm} style={{ backgroundColor: "#454E7C", color: "white", marginRight: 0 }}>{t('New')}</AntButton>
            <AntButton type="default" size="large" onClick={() => form.resetFields()} icon={<ReloadOutlined />} style={{ backgroundColor: "#454E7C", color: "white", marginRight: 0 }} />
            <AntButton type="primary" size="large" onClick={onSubmitForm} style={{ backgroundColor: "#454E7C", borderColor: "#454E7C" }}>{t('Submit Batch Data')}</AntButton>
          </ButtonContainer>
        </Form>
      </FormContainer>
    </StyledForm>
  );
}

export default ProductionBatchForm;