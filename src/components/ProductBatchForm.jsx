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
import { ReloadOutlined, CheckOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

const t = (s) => s;

// --- Styled Components (No Changes Here) ---
const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  max-width: 1200px;
  margin: 120 auto;
  padding-top: 8px;
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
    { key: 'ETH-001', id: 'ETH-001', date: '2025-08-21', volume: 1200, isCertified: true, timeOfDay: '10:15:00' },
    { key: 'ETH-002', id: 'ETH-002', date: '2025-08-23', volume: 950, isCertified: false, timeOfDay: '14:30:00' },
    { key: 'ETH-003', id: 'ETH-003', date: '2025-08-24', volume: 1180, isCertified: true, timeOfDay: '08:45:00' },
    { key: 'ETH-004', id: 'ETH-004', date: '2025-08-24', volume: 750, isCertified: false, timeOfDay: '16:05:00' },
    { key: 'ETH-005', id: 'ETH-005', date: '2025-08-25', volume: 1500, isCertified: true, timeOfDay: '11:20:00' },
];

// --- NEW ---: Dummy data table for Production Inputs & Parameters
// This data is linked by 'id' to the mockOccurrenceRecords.
const mockProductionData = {
  'ETH-001': { ethanolVol: 10500, beerFeedRate: 590, trimSpeeds: 120, hoursOfProduction: 24, wdgsProdTonHr: 5.1, wdgsAvgMoisture: 65, ddgsProdTonHr: 2.1, ddgsAvgMoisture: 10 },
  'ETH-002': { ethanolVol: 8500, beerFeedRate: 580, trimSpeeds: 115, hoursOfProduction: 22, wdgsProdTonHr: 4.8, wdgsAvgMoisture: 66, ddgsProdTonHr: 1.9, ddgsAvgMoisture: 11 },
  'ETH-003': { ethanolVol: 11000, beerFeedRate: 600, trimSpeeds: 125, hoursOfProduction: 24, wdgsProdTonHr: 5.2, wdgsAvgMoisture: 64, ddgsProdTonHr: 2.2, ddgsAvgMoisture: 9 },
  'ETH-004': { ethanolVol: 7000, beerFeedRate: 570, trimSpeeds: 110, hoursOfProduction: 20, wdgsProdTonHr: 4.5, wdgsAvgMoisture: 67, ddgsProdTonHr: 1.8, ddgsAvgMoisture: 12 },
  'ETH-005': { ethanolVol: 12000, beerFeedRate: 610, trimSpeeds: 130, hoursOfProduction: 24, wdgsProdTonHr: 5.5, wdgsAvgMoisture: 63, ddgsProdTonHr: 2.3, ddgsAvgMoisture: 8 },
};


const fetchDailyTotals = async (dateRange) => {
  console.log(`Fetching totals for date range: ${dateRange?.[0]?.format('YYYY-MM-DD')} to ${dateRange?.[1]?.format('YYYY-MM-DD')}`);
  return Promise.resolve({
    totalWdgs: 125.50,
    totalDdgs: 250.75,
  });
};

const defaultFormValues = {
  tankNumber: 8422,
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
  const dateRange = Form.useWatch('dateRange', form);

  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [certifiedRecordDate, setCertifiedRecordDate] = useState(null);

  useEffect(() => {
    setAllRecords(mockOccurrenceRecords);
  }, []);

  useEffect(() => {
    if (dateRange && dateRange.length === 2 && allRecords.length > 0) {
      const [startDate, endDate] = dateRange;
      const startDateStr = startDate.format('YYYY-MM-DD');
      const endDateStr = endDate.format('YYYY-MM-DD');
      
      const recordsInRange = allRecords.filter(record => {
        const recordDate = record.date;
        return recordDate >= startDateStr && recordDate <= endDateStr;
      });
      
      setFilteredRecords(recordsInRange);
      setSelectedRowKeys([]);
    } else {
        setFilteredRecords([]);
    }
  }, [dateRange, allRecords]);
  
  useEffect(() => {
    form.setFieldsValue({
      numTransfers: filteredRecords.length,
    });
  }, [filteredRecords, form]);

  const openNotification = (placement, message) => {
    AntNotification.success({
      message,
      placement,
    });
  };

  const handleValuesChange = (changedValues, allValues) => {
    if ('cornBu' in changedValues || 'beerFeedAdjustment' in changedValues || 'wdgsTons' in changedValues || 'ddgsTons' in changedValues) {
      return;
    }
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
      calculatedDdgs = (((100 - numWdgsMoisture) * numDdgsProd) / (100 - numDdgsMoisture)) * numHours * calculatedAdjustment;
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
  };

  const onSubmitForm = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submitting to product_batch table:', values);
      console.log('Ethanol Records for this batch:', filteredRecords);
      openNotification('bottomRight', 'Production Batch Data saved successfully');
      newForm();
    } catch (error) {
      console.log('Validation Failed:', error);
    }
  };

  useEffect(() => {
    if (dateRange && dateRange.length === 2) {
      fetchDailyTotals(dateRange).then(data => {
        form.setFieldsValue({
          dailyTotalWdgs: data.totalWdgs.toFixed(2),
          dailyTotalDdgs: data.totalDdgs.toFixed(2),
        });
      });
    }
  }, [dateRange, form]);

  const tableColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Time of Day', dataIndex: 'timeOfDay', key: 'timeOfDay' },
    { title: 'Volume (Liters)', dataIndex: 'volume', key: 'volume' },
    {
      title: 'Is Certified',
      dataIndex: 'isCertified',
      key: 'isCertified',
      align: 'center',
      render: (isCertified) => isCertified ? <CheckOutlined style={{ color: '#454E7C', fontSize: '18px' }} /> : null,
    },
  ];

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // --- MODIFIED ---: This function now aggregates data and auto-populates the form.
  const handleSubmitCertified = () => {
    const count = selectedRowKeys.length;
    console.log('Submitting Certified Records:', selectedRowKeys);

    // Initialize an accumulator for the production data fields
    const aggregatedData = {
      ethanolVol: 0,
      beerFeedRate: 0,
      trimSpeeds: 0,
      hoursOfProduction: 0,
      wdgsProdTonHr: 0,
      wdgsAvgMoisture: 0,
      ddgsProdTonHr: 0,
      ddgsAvgMoisture: 0,
    };

    // Iterate over selected keys and sum up the corresponding production data
    selectedRowKeys.forEach(key => {
      const data = mockProductionData[key];
      if (data) {
        for (const field in aggregatedData) {
          // Add the value from the mock data to our aggregate object
          aggregatedData[field] += data[field] || 0;
        }
      }
    });

    // Auto-populate the form's fields with the aggregated data
    form.setFieldsValue({
      ...aggregatedData,
      productionDate: certifiedRecordDate,
    });

    openNotification('bottomRight', `Submitted ${count} record(s) and auto-populated production data.`);
    setSelectedRowKeys([]);
    setCertifiedRecordDate(null); // Optional: clear the date after submitting
  };


  const disabledDate = (current) => {
    return current && current > moment().endOf('day');
  };

  return (
    <StyledForm>
      <GlobalStyle />
      <FormContainer>
        <Form form={form} {...formProps} onValuesChange={handleValuesChange} initialValues={defaultFormValues}>
          <SectionContainer>
            <SectionTitle>{t('Batch Details')}</SectionTitle>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ width: 'calc(50% - 8px)' }}>
                  <Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Date Range')}</>} name="dateRange">
                    <RangePicker style={{ width: '100%' }} disabledDate={disabledDate} format="YYYY-MM-DD" />
                  </Form.Item>
                </div>
                <div style={{ width: 'calc(50% - 8px)' }}>
                  <Form.Item label={<><span style={{color: 'red'}}>  </span> {t('Tank Number')}</>} name="tankNumber"><Select><Option value={8422}>8422</Option><Option value={8433}>8433</Option></Select></Form.Item>
                </div>
                <div style={{ width: 'calc(50% - 8px)' }}>
                  <Form.Item label={<><span style={{color: 'red'}}>  </span> {t('Number of Transfers')}</>} name="numTransfers"><Input type="number" readOnly /></Form.Item>
                </div>
              </div>

              <SubSectionTitle style={{ marginTop: '24px' }}>{t('Ethanol Occurrence Records')}</SubSectionTitle>
              {dateRange && dateRange.length === 2 && (
                <div style={{ marginBottom: '8px', color: '#666', fontSize: '12px' }}>
                  Showing records from {dateRange[0].format('YYYY-MM-DD')} to {dateRange[1].format('YYYY-MM-DD')} ({filteredRecords.length} records found)
                </div>
              )}
              <Table rowSelection={rowSelection} columns={tableColumns} dataSource={filteredRecords} pagination={false} bordered />
              
              {/* Datepicker for ethanol occurrence records */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div>
                  <span style={{ marginRight: '8px', color: '#1d1818', fontSize: '16px' }}>
                    <span style={{color: 'red'}}>* </span>Select date to set for batch
                  </span>
                  <DatePicker  
                    value={certifiedRecordDate}
                    onChange={(date) => setCertifiedRecordDate(date)}
                    format="YYYY-MM-DD"
                    disabledDate={disabledDate}
                  />
                </div>
                <AntButton
                  onClick={handleSubmitCertified}
                  disabled={selectedRowKeys.length === 0 || !certifiedRecordDate}
                  style={{ backgroundColor: "#454E7C", color: "white", marginRight: 0 }}
                >
                  Submit Certified Records ({selectedRowKeys.length} selected)
                </AntButton>
              </div>
            </div>
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>{t('Production Inputs & Parameters')}</SectionTitle>
            <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: 'calc(50% - 8px)' }}>
                <Form.Item  
                  label={t('Production Date')}
                  name="productionDate"
                  rules={[{ required: true, message: 'Please set a production date via the section above!' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </div>
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
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('Corn (bu)')} name="cornBu"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('Beer Feed Adjustment')} name="beerFeedAdjustment"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('WDGS (tons)')} name="wdgsTons"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('DDGS (tons)')} name="ddgsTons"><Input type="number" step="any" /></Form.Item></div>
            </div>
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>{t('Daily Totals')}</SectionTitle>
            <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('Total WDGS (tons)')} name="dailyTotalWdgs"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('Total DDGS (tons)')} name="dailyTotalDdgs"><Input type="number" step="any" /></Form.Item></div>
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