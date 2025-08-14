import React, { useEffect } from 'react';
import {
  Button as AntButton,
  DatePicker,
  Form,
  Input,
  Select,
  ConfigProvider,
  notification as AntNotification,
} from 'antd';
import moment from 'moment';
import styled, { createGlobalStyle } from 'styled-components';
import { ReloadOutlined } from '@ant-design/icons'; // Added import

const { Option } = Select;

// Helper function for translation (since @superset-ui/core is not available)
const t = (s) => s;

// Styled Components
const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;
// Button
// const BelowTitleButtonContainer = styled.div` 
//   display: flex;
//   justify-content: flex-end;
//   margin-top: 50px;
//   ${'' /* margin-bottom: 24px; */}
//   width: 100%;
// `;

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
  color: #000000ff; /* Assuming a dark gray color */
`;

const SubSectionTitle = styled.h4`
  margin-bottom: 12px;
  color: #666; /* Assuming a slightly lighter dark gray */
  font-size: 14px;
  font-weight: 500;
`;

const CalculationBox = styled.div`
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
  gap: 8px; /* Assuming gridUnit * 2 = 4 * 2 = 8px */
  padding: 16px; /* Assuming gridUnit * 4 = 4 * 4 = 16px */
  background: #f5f5f5; /* Assuming a light gray */
  border-radius: 4px; /* Assuming gridUnit * 1 = 4 * 1 = 4px */
  border: 1px solid #e0e0e0; /* Assuming a light gray border */
`;

const MathOperator = styled.span`
  font-size: 24px; /* Assuming typography.sizes.xl */
  color: #888; /* Assuming a base grayscale color */
  padding: 4px; /* Assuming gridUnit */
  margin-bottom: 24px; /* Assuming gridUnit * 6 */
`;

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 500;
  color: #454E7C; 
  ${'' /* margin: 0 0 32px 0; */}
`;

const SectionContainer = styled.div`
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-top: 16px;
  background: white;
  width: 100%; /* Ensure it takes full width */
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 150px;
`;

const TopButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-bottom: 24px;
  background: white;
  width: 100%; /* Ensure it takes full width */
`;

const TankInfoContainer = styled.div`
  gap: 8px; /* Assuming gridUnit * 2 */
  padding: 16px; /* Assuming gridUnit * 4 */
  background: #f5f5f5; /* Assuming a light gray */
  border-radius: 4px; /* Assuming gridUnit * 1 */
  border: 1px solid #e0e0e0; /* Assuming a light gray border */
  width: ${(props) => props.width || '100%'};
`;

const GlobalStyle = createGlobalStyle`
  .ant-form-item {
    margin-bottom: 8px !important;
  }
`;

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

const verticalLayout = {
    labelCol: { span: 24 },
    wrapperCol: { span: 24 },
};

// Mock function to simulate fetching data from a backend
const fetchDailyTotals = async (date) => {
  console.log(`Fetching totals for ${date.format('YYYY-MM-DD')}`);
  // In a real app, this would be an API call.
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

function ProductionBatchForm(props) {
  const [form] = Form.useForm();
  const productionDate = Form.useWatch('productionDate', form);

  const openNotification = (placement) => {
    AntNotification.success({
      message: `Production Batch Data saved successfully`,
      placement,
    });
  };

  const handleValuesChange = (_, allValues) => {
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
    form.resetFields();
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
    if (productionDate) {
      fetchDailyTotals(productionDate).then(data => {
        form.setFieldsValue({
          dailyTotalWdgs: data.totalWdgs.toFixed(2),
          dailyTotalDdgs: data.totalDdgs.toFixed(2),
        });
      });
    }
  }, [productionDate, form]);


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
          {/* <PageTitle style={{ textAlign: "center", marginTop: "150px", marginBottom: "4px" }}>{t('Product Batch Form')}</PageTitle> */}
          <ButtonContainer>
        <AntButton type="default" size="large" onClick={newForm} style={{ backgroundColor: "#454E7C", color: "white", marginRight: 0 }}>{t('New')}</AntButton>
        {/* <AntButton type="default" size="large" onClick={handleClose} style={{ backgroundColor: "#454E7C", color: "white", marginRight: 0 }}>{t('Close')}</AntButton> */}
        <AntButton type="default" size="large" onClick={() => form.resetFields()} icon={<ReloadOutlined />} style={{ backgroundColor: "#454E7C", color: "white", marginRight: 0 }} />
        <AntButton type="primary" size="large" onClick={onSubmitForm} style={{ backgroundColor: "#454E7C", borderColor: "#454E7C" }}>{t('Submit Batch Data')}</AntButton>
      </ButtonContainer>
          <SectionContainer>
            <SectionTitle>{t('Batch Details')}</SectionTitle>
            <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Date')}</>} name="productionDate"><DatePicker style={{ width: '100%' }} /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Time of Day')}</>} name="timeOfDay"><Select><Option value="AM">AM</Option><Option value="PM">PM</Option></Select></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Tank Number')}</>} name="tankNumber"><Select><Option value={8422}>8422</Option><Option value={8433}>8433</Option></Select></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Number of Transfers')}</>} name="numTransfers"><Input type="number" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Certification')}</>} name="isCertified"><Select><Option value="Yes">Yes</Option><Option value="No">No</Option></Select></Form.Item></div>
            </div>
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>{t('Production Inputs & Parameters')}</SectionTitle>
            <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Undenatured Ethanol Net Vol (gal)')}</>} name="ethanolVol"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Beer Feed Rate')}</>} name="beerFeedRate"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Trim Speeds')}</>} name="trimSpeeds"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('Hours of Production')}</>} name="hoursOfProduction"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('WDGS Production (tons/hour)')}</>} name="wdgsProdTonHr"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('WDGS Avg % Moisture')}</>} name="wdgsAvgMoisture"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('DDGS Production (tons/hour)')}</>} name="ddgsProdTonHr"><Input type="number" step="any" /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={<><span style={{color: 'red'}}>* </span> {t('DDGS Avg % Moisture')}</>} name="ddgsAvgMoisture"><Input type="number" step="any" /></Form.Item></div>
            </div>
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>{t('Calculated Values')}</SectionTitle>
            <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('Corn (bu)')} name="cornBu"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('Beer Feed Adjustment')} name="beerFeedAdjustment"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('WDGS (tons)')} name="wdgsTons"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('DDGS (tons)')} name="ddgsTons"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></div>
            </div>
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>{t('Daily Totals')}</SectionTitle>
            <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('Total WDGS (tons)')} name="dailyTotalWdgs"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></div>
                <div style={{ width: 'calc(50% - 8px)' }}><Form.Item label={t('Total DDGS (tons)')} name="dailyTotalDdgs"><Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#666" }} /></Form.Item></div>
            </div>
          </SectionContainer>
        {/* <ButtonContainer>
        <AntButton type="default" size="large" onClick={newForm} style={{ backgroundColor: "#454E7C", color: "white", marginRight: 0 }}>{t('New')}</AntButton>
        <AntButton type="default" size="large" onClick={handleClose} style={{ backgroundColor: "#454E7C", color: "white", marginRight: 0 }}>{t('Close')}</AntButton>
        <AntButton type="default" size="large" onClick={() => form.resetFields()} icon={<ReloadOutlined />} style={{ backgroundColor: "#454E7C", color: "white", marginRight: 0 }} />
        <AntButton type="primary" size="large" onClick={onSubmitForm} style={{ backgroundColor: "#454E7C", borderColor: "#454E7C" }}>{t('Submit Batch Data')}</AntButton>
      </ButtonContainer> */}
        </Form>
      </FormContainer>
    </StyledForm>
  );
}

export default ProductionBatchForm;