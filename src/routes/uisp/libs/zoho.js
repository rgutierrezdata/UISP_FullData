const logger = require('../../../config/logger.js');
const axios = require('axios');

//Solicitud de nuevo token de acceso para Zoho Subscriptions
exports.generateAccessToken = async (client_id, client_secret, refresh_token) => {
  const URL = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refresh_token}&client_id=${client_id}&client_secret=${client_secret}&grant_type=refresh_token`;

  try {
    const data = await axios.post(URL);
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: generateAccessToken - Error ${error.response.data.message}`);
    console.log("GENERATE_ACCESS_TOKEN_ERROR ===>", error);
    return error;
  }
}

//Creación de cliente + subscripción
exports.createSubscriptionCustomer = async (domain_url, organizationid, oauthtoken, zoho_body) => {
  //Create a single customer ---> https://${domain-url}/api/v1/customers
  //Create a subscription for a new customer ---> https://{{domain-url}}/api/v1/subscriptions
  
  const URL = `https://${domain_url}/api/v1/subscriptions`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`,
    "Content-Type": "application/json"
  }

  try {
    const data = await axios.post(URL, zoho_body, {headers: headers})
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: createSubscriptionCustomer - Error ${error.response.data.message}`);
    console.log("ZOHO_CREATE_SUBSCRIPTION_CUSTOMER_ERROR ===>", error);
    return error;
  }
}

//Añadir subscripción a cliente ya existente (cliente ya creado) en Zoho Subscriptions
exports.addNewSubscription = async (domain_url, organizationid, oauthtoken, zoho_body) => {
  //Create a single customer ---> https://${domain-url}/api/v1/customers
  //Create a subscription for a new customer ---> https://{{domain-url}}/api/v1/subscriptions
  
  const URL = `https://${domain_url}/api/v1/subscriptions`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`,
    "Content-Type": "application/json"
  }

  try {
    const data = await axios.post(URL, zoho_body, {headers: headers})
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: addNewSubscription - Error ${error.response.data.message}`);
    console.log("ZOHO_ADD_NEW_SUBSCRIPTION_ERROR ===>", error);
    return error;
  }
}

//Crear solamente cliente para aquellas personas sin datos de subscripciones
exports.createCustomerWithoutSubscription = async (domain_url, organizationid, oauthtoken, zoho_body) => {
  //Create a single customer ---> https://${domain-url}/api/v1/customers
  //Create a subscription for a new customer ---> https://{{domain-url}}/api/v1/subscriptions
  
  const URL = `https://${domain_url}/api/v1/customers`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`
  }

  try {
    const data = await axios.post(URL, zoho_body, {headers: headers})
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: createCustomerWithoutSubscription - Error ${error.response.data.message}`);
    console.log("ZOHO_CREATE_SINGLE_CUSTOMER_ERROR ===>", error);
    return error;
  }
}

//Borrado de clientes de Zoho Subscriptions
exports.getTransactions = async(domain_url, organizationid, oauthtoken, ClientIDZoho) => {
  const URL = `https://${domain_url}/api/v1/transactions?customer_id=${ClientIDZoho}`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`
  }

  try {
    const data = await axios.get(URL, {headers: headers})
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: getTransactions - Error ${error.response.data.message}`);
    console.log("ZOHO_GET_TRANSACTIONS_ERROR ===>", error);
    return error;
  }
}

exports.deletePayment = async(domain_url, organizationid, oauthtoken, paymentID) => {
  const URL = `https://${domain_url}/api/v1/payments/${paymentID}`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`
  }

  try {
    const data = await axios.delete(URL, {headers: headers})
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: deletePayment - Error ${error.response.data.message}`);
    console.log("ZOHO_DELETE_PAYMENT_ERROR ===>", error);
    return error;
  }

}

exports.deleteCreditNote = async(domain_url, organizationid, oauthtoken, creditID) => {
  const URL = `https://${domain_url}/api/v1/creditnotes/${creditID}`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`
  }

  try {
    const data = await axios.delete(URL, {headers: headers})
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: deleteCreditNote - Error ${error.response.data.message}`);
    console.log("ZOHO_DELETE_CREDIT_ERROR ===>", error);
    return error;
  }
}

exports.deleteInvoice = async(domain_url, organizationid, oauthtoken, invoiceID) => {
  const URL = `https://${domain_url}/api/v1/invoices/${invoiceID}`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`
  }

  try {
    const data = await axios.delete(URL, {headers: headers})
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: deleteInvoice - Error ${error.response.data.message}`);
    console.log("ZOHO_DELETE_INVOICE_ERROR ===>", error);
    return error;
  }
}

exports.getAllSubscriptions = async(domain_url, organizationid, oauthtoken, ClientIDZoho) => {
  const URL = `https://${domain_url}/api/v1/subscriptions?filter_by=SubscriptionStatus.All&customer_id=${ClientIDZoho}`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`
  }

  try {
    const data = await axios.get(URL, {headers: headers})
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: getAllSubscriptions - Error ${error.response.data.message}`);
    console.log("ZOHO_GET_ALL_SUBSCRIPTIONS_ERROR ===>", error);
    return error;
  }
}

exports.deleteSubscription = async(domain_url, organizationid, oauthtoken, subscriptionID) => {
  const URL = `https://${domain_url}/api/v1/subscriptions/${subscriptionID}`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`
  }

  try {
    const data = await axios.delete(URL, {headers: headers})
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: deleteSubscription - Error ${error.response.data.message}`);
    console.log("ZOHO_DELETE_SUBSCRIPTION_ERROR ===>", error);
    return error;
  }
}

exports.deleteCustomer = async(domain_url, organizationid, oauthtoken, ClientIDZoho) => {
  const URL = `https://${domain_url}/api/v1/customers/${ClientIDZoho}`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`
  }

  try {
    const data = await axios.delete(URL, {headers: headers})
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: deleteCustomer - Error ${error.response.data.message}`);
    console.log("ZOHO_DELETE_CUSTOMER_ERROR ===>", error);
    return error;
  }
}

exports.addCreditViaPayment = async(domain_url, organizationid, oauthtoken, client_details) => {
  const URL = `https://${domain_url}/api/v1/payments`;
  
  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`
  }

  try {
    const data = await axios.post(URL, client_details, {headers: headers});
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: addCreditViaPayment - Error ${error.response.data.message}`);
    console.log("ZOHO_ADD_CREDIT_VIA_PAYMENT_ERROR ===>", error);
    return error;
  }
}

exports.addChargeToSubscription = async(domain_url, organizationid, oauthtoken, subscription_id, zoho_charge_body) => {
  const URL = `https://${domain_url}/api/v1/subscriptions/${subscription_id}/charge`;

  const headers = {
    "X-com-zoho-subscriptions-organizationid": organizationid,
    "Authorization": `Zoho-oauthtoken ${oauthtoken}`
  }

  try {
    const data = await axios.post(URL, zoho_charge_body, {headers: headers});
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: zoho.js - Function Name: addChargeToSubscription - Error ${error.response.data.message}`);
    console.log("ZOHO_ADD_CREDIT_VIA_PAYMENT_ERROR ===>", error);
    return error;
  }
}

//Cancelar o colocar como expiradas subscripciones que tienen estado distinto de activo

/*
  1. Validar en postman cancelación ===> churn messages.
  2. Validar en postman actualización a expired.

  Get churn messages ya creado en postman
*/