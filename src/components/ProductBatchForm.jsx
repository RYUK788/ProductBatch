import React, { useEffect, useState } from 'react';
import {
  Button as AntButton,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  notification as AntNotification,
  Table,
} from 'antd';
import moment from 'moment';
import styled, { createGlobalStyle } from 'styled-components';
import { ReloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { fetchData } from '../../api.js';

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

const defaultFormValues = {
  cornBu: '0.00',
  beerFeedAdjustment: '1.00',
  wdgsTons: '0.00',
  ddgsTons: '0.00',
  dailyTotalWdgs: '0.00',
  dailyTotalDdgs: '0.00',
  isCertified: 0,
};

// --- Main Component ---
function ProductionBatchForm(props) {
  const [form] = Form.useForm();

  // Use useState for robustly tracking filter changes
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [selectedTankNumber, setSelectedTankNumber] = useState(null);

  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [certifiedRecordDate, setCertifiedRecordDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // useEffect for loading the main table data
  useEffect(() => {
    const loadOccurrenceRecords = async () => {
        if (selectedDateRange && selectedDateRange.length === 2 && selectedTankNumber) {
            setIsLoading(true);
            setSelectedRowKeys([]);
            const [startDate, endDate] = selectedDateRange;
            const startDateStr = startDate.format('YYYY-MM-DD');
            const endDateStr = endDate.format('YYYY-MM-DD');

            const query = `
                SELECT id, transfer_date, latest_end_ts, TOT_FIC_8403_Total, isCertified 
                FROM ProductBatch_${selectedTankNumber} 
                WHERE transfer_date BETWEEN '${startDateStr}' AND '${endDateStr}'
            `;
            
            try {
                const recordsFromDb = await fetchData(query);
                const mappedRecords = recordsFromDb.map(record => ({
                    key: record.id,
                    id: record.id,
                    date: record.transfer_date,
                    timeOfDay: record.latest_end_ts,
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
  }, [selectedDateRange, selectedTankNumber]);
  
 useEffect(() => {
  const loadDailyTotals = async () => {
    if (selectedDateRange && selectedDateRange.length === 2 && selectedTankNumber) {
      const [startDate, endDate] = selectedDateRange;
      const startDateStr = startDate.format('YYYY-MM-DD');
      const endDateStr = endDate.format('YYYY-MM-DD');

      // 1. Ask the database for ALL individual rows from the selected tank
      const query = `
        SELECT 
          wdgs_production, 
          ddgs_production 
        FROM ProductBatch_${selectedTankNumber} 
        WHERE transfer_date BETWEEN '${startDateStr}' AND '${endDateStr}'
      `;
      
      try {
        // 2. Get the array of all records
        const allRecords = await fetchData(query);
        
        // 3. Manually calculate the sum using JavaScript's .reduce() method
        if (allRecords && allRecords.length > 0) {
          const totals = allRecords.reduce((acc, record) => {
            acc.totalWdgs += parseFloat(record.wdgs_production) || 0;
            acc.totalDdgs += parseFloat(record.ddgs_production) || 0;
            return acc;
          }, { totalWdgs: 0, totalDdgs: 0 });

          form.setFieldsValue({
            dailyTotalWdgs: totals.totalWdgs.toFixed(2),
            dailyTotalDdgs: totals.totalDdgs.toFixed(2),
          });
        } else {
           form.setFieldsValue({ dailyTotalWdgs: '0.00', dailyTotalDdgs: '0.00' });
        }
      } catch (error) { 
        console.error("Failed to fetch daily totals:", error);
      }
    } else {
        // Clear totals if filters are not set
        form.setFieldsValue({ dailyTotalWdgs: '0.00', dailyTotalDdgs: '0.00' });
    }
  };

  loadDailyTotals();
}, [selectedDateRange, selectedTankNumber]); // The hook now correctly depends on both filters

  // useEffect for updating the number of transfers display
  useEffect(() => {
    form.setFieldsValue({
      numTransfers: filteredRecords.length,
    });
  }, [filteredRecords]);

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
    // Update state based on form changes
    if ('dateRange' in changedValues) {
      setSelectedDateRange(changedValues.dateRange);
    }
    if ('tankNumber' in changedValues) {
      setSelectedTankNumber(changedValues.tankNumber);
    }
  
    // Trigger downstream calculations
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
      console.log('Submitting these values:', values);

      // --- CORRECTED LINE ---
      // We call .format() directly on the date object from the form.
      const formattedDate = values.productionDate.format('YYYY-MM-DD');

      const insertQuery = `
        INSERT INTO product_batch (
          production_date, tank_number, ethanol_vol, beer_feed_rate, 
          trim_speeds, hours_of_production, wdgs_prod_ton_hr, wdgs_avg_moisture, 
          ddgs_prod_ton_hr, ddgs_avg_moisture, is_certified, corn_bu, 
          beer_feed_adjustment, total_wdgs_tons, total_ddgs_tons
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;

      const queryParams = [
        formattedDate, // formatting first because moment interferes with DatePicker to change the date to current date instead of the date object which was picked up
        values.tankNumber,
        values.ethanolVol,
        values.beerFeedRate,
        values.trimSpeeds,
        values.hoursOfProduction,
        values.wdgsProdTonHr,
        values.wdgsAvgMoisture,
        values.ddgsProdTonHr,
        values.ddgsAvgMoisture,
        values.isCertified,
        values.cornBu,
        values.beerFeedAdjustment,
        values.wdgsTons,
        values.ddgsTons
      ];
      
      const result = await fetchData(insertQuery, queryParams);
      console.log('API Response:', result);

      openNotification('bottomRight', 'Production Batch Data saved successfully!');
      
      form.resetFields();
      setSelectedDateRange(null);
      setSelectedTankNumber(null);

    } catch (error) {
      console.error('Submission Failed:', error);
      AntNotification.error({
          message: 'Submission Failed',
          description: error.message || 'An error occurred while saving the data.',
          placement: 'bottomRight',
      });
    }
  };
// Ethanol Occurence Records Table
  const tableColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { 
        title: 'Date', 
        dataIndex: 'date', 
        key: 'date',
        render: (text) => moment(text).format('DD-MM-YYYY') 
    },
    { 
        title: 'Time of Day', 
        dataIndex: 'timeOfDay', 
        key: 'timeOfDay',
        render: (text) => moment(text).format('hh:mm:ss A')
    },
    { title: 'Volume (Gallons)', dataIndex: 'volume', key: 'volume', render: (text) => parseFloat(text).toFixed(2) },
    {
        title: 'Is Certified',
        dataIndex: 'isCertified',
        key: 'isCertified',
        align: 'center',
        render: (value) => 
            value === 1 
                ? <CheckOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                : <CloseOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
    },
  ];

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: record.isCertified === 1,
    }),
  };

  const handleSubmitCertified = async () => {
    const count = selectedRowKeys.length;
    if (count === 0) {
        return;
    }

    const selectedRecords = filteredRecords.filter(record => selectedRowKeys.includes(record.key));
    const totalEthanolVol = selectedRecords.reduce((sum, record) => sum + (parseFloat(record.volume) || 0), 0);
    const hoursOfProduction = count * 12;
    const idsToFetch = selectedRowKeys.join(',');

    const query = `
        SELECT 
            FIC_3513_SP, 
            SC_6617_Out, 
            wdgs_moisture, 
            ddgs_moisture,
            wdgs_production,
            ddgs_production
        FROM ProductBatch_${selectedTankNumber} 
        WHERE id IN (${idsToFetch})
    `;

    try {
        const additionalData = await fetchData(query);
        if (!additionalData || additionalData.length === 0) {
            throw new Error("Could not fetch production data for the selected records.");
        }

        const sums = additionalData.reduce((acc, record) => {
            acc.beerFeedRate += parseFloat(record.FIC_3513_SP) || 0;
            acc.trimSpeeds += parseFloat(record.SC_6617_Out) || 0;
            acc.wdgsAvgMoisture += parseFloat(record.wdgs_moisture) || 0;
            acc.ddgsAvgMoisture += parseFloat(record.ddgs_moisture) || 0;
            acc.wdgsProdTonHr += parseFloat(record.wdgs_production) || 0;
            acc.ddgsProdTonHr += parseFloat(record.ddgs_production) || 0;
            return acc;
        }, { 
            beerFeedRate: 0, 
            trimSpeeds: 0, 
            wdgsAvgMoisture: 0, 
            ddgsAvgMoisture: 0,
            wdgsProdTonHr: 0,
            ddgsProdTonHr: 0
        });

        const avgBeerFeedRate = sums.beerFeedRate / additionalData.length;
        const avgTrimSpeeds = sums.trimSpeeds / additionalData.length;
        const avgWdgsMoisture = sums.wdgsAvgMoisture / additionalData.length;
        const avgDdgsMoisture = sums.ddgsAvgMoisture / additionalData.length;
        
        const valuesToSet = {
            productionDate: certifiedRecordDate,
            isCertified: 1,
            ethanolVol: totalEthanolVol.toFixed(2),
            hoursOfProduction: hoursOfProduction,
            beerFeedRate: avgBeerFeedRate.toFixed(2),
            trimSpeeds: avgTrimSpeeds.toFixed(2),
            wdgsAvgMoisture: avgWdgsMoisture.toFixed(2),
            ddgsAvgMoisture: avgDdgsMoisture.toFixed(2),
            wdgsProdTonHr: sums.wdgsProdTonHr.toFixed(2), 
            ddgsProdTonHr: sums.ddgsProdTonHr.toFixed(2),
        };
        
        form.setFieldsValue(valuesToSet);
        runCalculations({ ...form.getFieldsValue(), ...valuesToSet });

        openNotification('bottomRight', `Submitted ${count} record(s) and auto-populated production data.`);
        setSelectedRowKeys([]);
        setCertifiedRecordDate(null);

    } catch (error) {
        console.error("Error submitting certified records:", error);
        AntNotification.error({
            message: 'Submission Failed',
            description: error.message,
            placement: 'bottomRight',
        });
    }
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
                  <Form.Item label={<><span style={{color: 'red'}}> </span> {t('Tank Number')}</>} name="tankNumber">
                      <Select placeholder="Select a Tank">
                          <Option value={8422}>8422</Option>
                          <Option value={8433}>8433</Option>
                      </Select>
                  </Form.Item>
                </div>
                <div style={{ width: 'calc(50% - 8px)' }}>
                  <Form.Item label={<><span style={{color: 'red'}}> </span> {t('Number of Transfers')}</>} name="numTransfers"><Input type="number"  disabled /></Form.Item>
                </div>
              </div>

              <SubSectionTitle style={{ marginTop: '24px' }}>{t('Ethanol Occurrence Records')}</SubSectionTitle>
              {selectedDateRange && selectedDateRange.length === 2 && (
                <div style={{ marginBottom: '8px', color: '#666', fontSize: '12px' }}>
                  Showing records from {selectedDateRange[0].format('YYYY-MM-DD')} to {selectedDateRange[1].format('YYYY-MM-DD')} ({filteredRecords.length} records found)
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

          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <AntButton type="default" size="large" onClick={closeForm} style={{ backgroundColor: "#454E7C", color: "white", marginRight: '8px' }}>{t('Close')}</AntButton>
            <AntButton type="default" size="large" onClick={() => {
                form.resetFields();
                setSelectedDateRange(null);
                setSelectedTankNumber(null);
            }} icon={<ReloadOutlined />} style={{ backgroundColor: "#454E7C", color: "white", marginRight: '8px' }} />
            <AntButton type="primary" size="large" onClick={onSubmitForm} style={{ backgroundColor: "#454E7C", borderColor: "#454E7C" }}>{t('Submit Batch Data')}</AntButton>
          </div>
        </Form>
      </FormContainer>
    </StyledForm>
  );
}

export default ProductionBatchForm;