import React, { useEffect, useState } from 'react';
import {
  Button as AntButton,
  DatePicker,
  Form,
  Input,InputNumber,
  Select,
  notification as AntNotification,
  Table,
} from 'antd';
import moment from 'moment';
import styled, { createGlobalStyle } from 'styled-components';
import { ReloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { fetchData } from '../../api.js'; // Import your fetchData function

const { RangePicker } = DatePicker;
const { Option } = Select;

const t = (s) => s;

// --- Styled Components ---
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
const mockProductionData = {
  '1': { ethanolVol: 10500, beerFeedRate: 590, trimSpeeds: 120, hoursOfProduction: 24, wdgsProdTonHr: 5.1, wdgsAvgMoisture: 65, ddgsProdTonHr: 2.1, ddgsAvgMoisture: 10 },
  '2': { ethanolVol: 8500, beerFeedRate: 580, trimSpeeds: 115, hoursOfProduction: 22, wdgsProdTonHr: 4.8, wdgsAvgMoisture: 66, ddgsProdTonHr: 1.9, ddgsAvgMoisture: 11 },
  '3': { ethanolVol: 11000, beerFeedRate: 600, trimSpeeds: 125, hoursOfProduction: 24, wdgsProdTonHr: 5.2, wdgsAvgMoisture: 64, ddgsProdTonHr: 2.2, ddgsAvgMoisture: 9 },
  '4': { ethanolVol: 7000, beerFeedRate: 570, trimSpeeds: 110, hoursOfProduction: 20, wdgsProdTonHr: 4.5, wdgsAvgMoisture: 67, ddgsProdTonHr: 1.8, ddgsAvgMoisture: 12 },
  '5': { ethanolVol: 12000, beerFeedRate: 610, trimSpeeds: 130, hoursOfProduction: 24, wdgsProdTonHr: 5.5, wdgsAvgMoisture: 63, ddgsProdTonHr: 2.3, ddgsAvgMoisture: 8 },
  '6': { ethanolVol: 11500, beerFeedRate: 605, trimSpeeds: 128, hoursOfProduction: 24, wdgsProdTonHr: 5.4, wdgsAvgMoisture: 64, ddgsProdTonHr: 2.2, ddgsAvgMoisture: 9 },
};

const fetchDailyTotals = async (dateRange) => {
  console.log(`Fetching totals for date range: ${dateRange?.[0]?.format('YYYY-MM-DD')} to ${dateRange?.[1]?.format('YYYY-MM-DD')}`);
  // This can also be converted to use your api.js fetchData if needed
  return Promise.resolve({
    totalWdgs: 125.50,
    totalDdgs: 250.75,
  });
};

const defaultFormValues = {
  tankNumber: 8422,
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

  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [certifiedRecordDate, setCertifiedRecordDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadOccurrenceRecords = async () => {
        if (dateRange && dateRange.length === 2) {
            setIsLoading(true);
            setSelectedRowKeys([]);
            const [startDate, endDate] = dateRange;
            const startDateStr = startDate.format('YYYY-MM-DD');
            const endDateStr = endDate.format('YYYY-MM-DD');

            const query = `
                SELECT id, transfer_date, end_ts, TOT_FIC_8403_Total, isCertified 
                FROM ProductBatch 
                WHERE transfer_date BETWEEN '${startDateStr}' AND '${endDateStr}'
            `;
            
            try {
                const recordsFromDb = await fetchData(query);
                
                const mappedRecords = recordsFromDb.map(record => ({
                    key: record.id,
                    id: record.id,
                    date: record.transfer_date,
                    timeOfDay: record.end_ts,
                    volume: record.TOT_FIC_8403_Total,
                    isCertified: record.isCertified,
                }));
                
                setFilteredRecords(mappedRecords);

            } catch (error) {
                console.error("Failed to fetch product batch records:", error);
                AntNotification.error({
                    message: 'Failed to Load Records',
                    description: error.message || 'An error occurred while fetching data.',
                    placement: 'bottomRight',
                });
            } finally {
                setIsLoading(false);
            }
        } else {
            setFilteredRecords([]);
        }
    };

    loadOccurrenceRecords();
  }, [dateRange]);
  
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
  
  const runCalculations = (currentValues) => {
    const numEthanolVol = parseFloat(currentValues.ethanolVol || '0');
    const numBeerFeedRate = parseFloat(currentValues.beerFeedRate || '0');
    const numHours = parseFloat(currentValues.hoursOfProduction || '0');
    const numWdgsProd = parseFloat(currentValues.wdgsProdTonHr || '0');
    const numWdgsMoisture = parseFloat(currentValues.wdgsAvgMoisture || '0');
    const numDdgsProd = parseFloat(currentValues.ddgsProdTonHr || '0');
    const numDdgsMoisture = parseFloat(currentValues.ddgsAvgMoisture || '0');
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

  const handleValuesChange = (changedValues, allValues) => {
    if ('cornBu' in changedValues || 'beerFeedAdjustment' in changedValues || 'wdgsTons' in changedValues || 'ddgsTons' in changedValues) {
      return;
    }
    runCalculations(allValues);
  };

  const closeForm = () => {
    window.close();
  };

  const onSubmitForm = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submitting to product_batch table:', values);
      console.log('Ethanol Records for this batch:', filteredRecords);
      openNotification('bottomRight', 'Production Batch Data saved successfully');
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
    { title: 'Date', dataIndex: 'date', key: 'date' , render: (text) => moment(text).format('DD-MM-YYYY') },
    { title: 'Time of Day', dataIndex: 'timeOfDay', key: 'timeOfDay' ,  render: (text) => moment(text).format('hh:mm:ss A') },
    { title: 'Volume (Gallons)', dataIndex: 'volume', key: 'volume', render: (text) => parseFloat(text).toFixed(2) },
    {
      title: 'Is Certified',
      dataIndex: 'isCertified',
      key: 'isCertified',
      align: 'center',
      render: (value) => 
            value === 1 
                ? <CheckOutlined style={{ color: '#52c41a', fontSize: '18px' }} /> // Green tick for 1
                : <CloseOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} /> // Red X for 0
    },
  ];

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: record.isCertified,
    }),
  };

  const handleSubmitCertified = () => {
    const count = selectedRowKeys.length;
    if (count === 0) {
        return;
    }

    console.log('Submitting Certified Records:', selectedRowKeys);

    const finalData = {
      ethanolVol: 0,
      beerFeedRate: 0,
      trimSpeeds: 0,
      hoursOfProduction: 0,
      wdgsProdTonHr: 0,
      wdgsAvgMoisture: 0,
      ddgsProdTonHr: 0,
      ddgsAvgMoisture: 0,
    };

    selectedRowKeys.forEach(key => {
      const data = mockProductionData[key];
      if (data) {
        for (const field in finalData) {
          finalData[field] += data[field] || 0;
        }
      }
    });
    
    finalData.beerFeedRate /= count;
    finalData.wdgsAvgMoisture /= count;
    finalData.ddgsAvgMoisture /= count;
    finalData.trimSpeeds /= count;

    const valuesToSet = {
        ...finalData,
        productionDate: certifiedRecordDate,
        isCertified: 1
    };
    
    form.setFieldsValue(valuesToSet);
    runCalculations({ ...form.getFieldsValue(), ...valuesToSet });

    openNotification('bottomRight', `Submitted ${count} record(s) and auto-populated production data.`);
    setSelectedRowKeys([]);
    setCertifiedRecordDate(null);
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
                  <Form.Item label={<><span style={{color: 'red'}}>  </span> {t('Tank Number')}</>} name="tankNumber"><Select><Option value={8422}>8422</Option><Option value={8433}>8433</Option></Select></Form.Item>
                </div>
                <div style={{ width: 'calc(50% - 8px)' }}>
                  <Form.Item label={<><span style={{color: 'red'}}>  </span> {t('Number of Transfers')}</>} name="numTransfers"><Input type="number"  disabled /></Form.Item>
                </div>
              </div>

              <SubSectionTitle style={{ marginTop: '24px' }}>{t('Ethanol Occurrence Records')}</SubSectionTitle>
              {dateRange && dateRange.length === 2 && (
                <div style={{ marginBottom: '8px', color: '#666', fontSize: '12px' }}>
                  Showing records from {dateRange[0].format('YYYY-MM-DD')} to {dateRange[1].format('YYYY-MM-DD')} ({filteredRecords.length} records found)
                </div>
              )}
              <Table 
                    rowSelection={rowSelection} 
                    columns={tableColumns} 
                    dataSource={filteredRecords} 
                    pagination={false} 
                    bordered 
                    loading={isLoading} 
                />
              
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
                      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        
                          <div>
                              <Form.Item
                                  label={t('Production Date')}
                                  name="productionDate"
                                  rules={[{ required: true, message: 'Please set a production date via the section above!' }]}
                              >
                                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={disabledDate} />
                              </Form.Item>
                          </div>

                         
                          <div>
                              <Form.Item
                                  label={t('Undenatured Ethanol Net Vol (gal)')}
                                  name="ethanolVol"
                                  rules={[{ required: true, message: 'Please enter the Ethanol Volume!' }]}
                              >
                                  <InputNumber style={{ width: '100%' }} precision={2} controls={false} />
                              </Form.Item>
                          </div>

                          <div>
                              <Form.Item
                                  label={t('Beer Feed Rate')}
                                  name="beerFeedRate"
                                  rules={[{ required: true, message: 'Please enter the Beer Feed Rate!' }]}
                              >
                                  <InputNumber style={{ width: '100%' }} precision={2} controls={false} />
                              </Form.Item>
                          </div>

                          <div>
                              <Form.Item
                                  label={t('Trim Speeds')}
                                  name="trimSpeeds"
                                  rules={[{ required: true, message: 'Please enter Trim Speeds!' }]}
                              >
                                  <InputNumber style={{ width: '100%' }} precision={2} controls={false} />
                              </Form.Item>
                          </div>

                          <div>
                              <Form.Item
                                  label={t('Hours of Production')}
                                  name="hoursOfProduction"
                                  rules={[{ required: true, message: 'Please enter the Hours of Production!' }]}
                              >
                                  <InputNumber style={{ width: '100%' }} precision={2} controls={false} />
                              </Form.Item>
                          </div>

                          <div>
                              <Form.Item
                                  label={t('WDGS Production (tons/hour)')}
                                  name="wdgsProdTonHr"
                                  rules={[{ required: true, message: 'Please enter the WDGS Production!' }]}
                              >
                                  <InputNumber style={{ width: '100%' }} precision={2} controls={false} />
                              </Form.Item>
                          </div>

                          <div>
                              <Form.Item
                                  label={t('WDGS Avg % Moisture')}
                                  name="wdgsAvgMoisture"
                                  rules={[{ required: true, message: 'Please enter the WDGS Average Moisture!' }]}
                              >
                                  <InputNumber style={{ width: '100%' }} precision={2} controls={false} />
                              </Form.Item>
                          </div>

                          <div>
                              <Form.Item
                                  label={t('DDGS Production (tons/hour)')}
                                  name="ddgsProdTonHr"
                                  rules={[{ required: true, message: 'Please enter the DDGS Production!' }]}
                              >
                                  <InputNumber style={{ width: '100%' }} precision={2} controls={false} />
                              </Form.Item>
                          </div>

                          <div>
                              <Form.Item
                                  label={t('DDGS Avg % Moisture')}
                                  name="ddgsAvgMoisture"
                                  rules={[{ required: true, message: 'Please enter the DDGS Average Moisture!' }]}
                              >
                                  <InputNumber style={{ width: '100%' }} precision={2} controls={false} />
                              </Form.Item>
                          </div>

                          <div>
                              <Form.Item label={t('Is Certified')} name="isCertified">
                                  <Input type="number" disabled />
                              </Form.Item>
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

          <div style={{ textAlign: 'right' }}>
            <AntButton type="default" size="large" onClick={closeForm} style={{ backgroundColor: "#454E7C", color: "white", marginRight: '8px' }}>{t('Close')}</AntButton>
            <AntButton type="default" size="large" onClick={() => form.resetFields()} icon={<ReloadOutlined />} style={{ backgroundColor: "#454E7C", color: "white", marginRight: '8px' }} />
            <AntButton type="primary" size="large" onClick={onSubmitForm} style={{ backgroundColor: "#454E7C", borderColor: "#454E7C" }}>{t('Submit Batch Data')}</AntButton>
          </div>
        </Form>
      </FormContainer>
    </StyledForm>
  );
}

export default ProductionBatchForm;