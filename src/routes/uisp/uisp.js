const logger = require('../../config/logger');
const sql = require('msnodesqlv8');
const axios = require('axios');

const connectionString = "Driver={SQL Server Native Client 11.0};server=DESKTOP-G87VA7A\\SQLEXPRESS;Database=uispdb;Trusted_Connection=Yes;";

//Funciones para back up de datos en base de datos ===> UISP API
exports.getClientsUISP = async(offset, limit) => {
  const baseUrl = process.env.baseUrl;
  const URL = `${baseUrl}/clients?offset=${offset}&limit=${limit}`;

  const headers = {
    "X-Auth-App-Key": process.env.appKey
  }

  try {
    const data = await axios.get(URL, {headers: headers});
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: uisp.js - Function Name: getUISPData - Error ${error}`);
    console.log("GET_CLIENTS_UISP_DATA ===>", error);
    return error;
  }
}

exports.getClientService = async(UISP_client_id) => {
  const baseUrl = process.env.baseUrl;
  const URL = `${baseUrl}/clients/services?clientId=${UISP_client_id}`;

  const headers = {
    "X-Auth-App-Key": process.env.appKey
  }

  try {
    const data = await axios.get(URL, {headers: headers});
    if (data.data.length === 0) {
      return [];
    }
    else {
      return data.data;
    }
  }
  catch(error) {
    logger.log('info',`File: uisp.js - Function Name: getUISPData - Error ${error}`);
    console.log("GET_CLIENT_SERVICE_ERROR ===>", error);
    return error;
  }
}

//Funciones para trabajar base de datos local ===> uispdb
exports.insertClient = async (firstName, lastName, companyName, displayName, email, username, phone, country, state, city, street, zip, customerID_UISP, clientType, clientTypeName_UISP, clientTypeName_Zoho, subscription_status, subscription_status_name_UISP, subscription_status_name_Zoho, subscription_price, currency_code, subscription_codes, subscription_description, account_balance, account_credit, account_outstanding, UISP_subscription_ID, service_plan_period_ID, service_plan_period, latitude, longitude, google_maps_url, node, organizationName, servicePlanID, activeFrom, RIF) => {
  var bool = true;

  const query = `
    INSERT INTO uispClients
    (
      FirstName, 
      LastName,
      CompanyName,
      DisplayName,
      Email,
      Username,
      Phone,
      Country,
      CountryState,
      City,
      Street,
      Zip,
      CustomerIDUISP,
      ClientType,
      ClientTypeNameUISP,
      ClientTypeNameZoho,
      SubscriptionStatus,
      SubscriptionStatusNameUISP,
      SubscriptionStatusNameZoho,
      SubscriptionPrice,
      CurrencyCode,
      SubscriptionCodes,
      SubscriptionDescription,
      AccountBalance,
      AccountCredit,
      AccountOutstanding,
      UISPSubscriptionID,
      ServicePlanPeriodID,
      ServicePlanPeriod,
      Latitude,
      Longitude,
      GoogleMapsURL,
      Node,
      OrganizationName,
      ServicePlanID,
      ActiveFrom,
      RIF
    )
    VALUES
    (
      ${firstName}, 
      ${lastName}, 
      ${companyName}, 
      ${displayName}, 
      ${email}, 
      ${username}, 
      ${phone}, 
      ${country}, 
      ${state}, 
      ${city}, 
      ${street}, 
      ${zip}, 
      ${customerID_UISP}, 
      ${clientType}, 
      ${clientTypeName_UISP}, 
      ${clientTypeName_Zoho}, 
      ${subscription_status}, 
      ${subscription_status_name_UISP}, 
      ${subscription_status_name_Zoho}, 
      ${subscription_price},   
      ${currency_code},   
      ${subscription_codes},      
      ${subscription_description},    
      ${account_balance},
      ${account_credit},
      ${account_outstanding},
      ${UISP_subscription_ID},
      ${service_plan_period_ID},
      ${service_plan_period},
      ${latitude}, 
      ${longitude}, 
      ${google_maps_url}, 
      ${node}, 
      ${organizationName}, 
      ${servicePlanID}, 
      ${activeFrom}, 
      ${RIF}
    )
  `;

  sql.query(connectionString, query, (err, rows) => {
    if(err === null) {
      bool = false;
    }
    else {
      console.log("=== ROW ===> ", query);
      console.log("=== ERROR ===> ", err);
      logger.log('info',`File: uisp.js - Function Name: insertClient - Error ${err} - customerID_UISP: ${customerID_UISP}`);
      bool = true;
    }
  }); 

  return bool;
}

//Migración de datos
exports.getAllData = async() => {

  return new Promise((resolve, reject) => {
    //SELECT TOP (1) * FROM [uispdb].[dbo].[uispData] ORDER BY uispdbID DESC
    //SELECT * FROM uispData WHERE uispdbID = 7008
    
    sql.query(connectionString, 'SELECT * FROM uispData WHERE uispdbID BETWEEN 2501 AND 3000', (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getAllData - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
  
}

exports.updateCustomer = async(uispdbID, zoho_client_id) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `UPDATE UISPData SET CustomerIDZoho = '${zoho_client_id}', IsCreatedZoho = 1 WHERE uispdbID = ${uispdbID}`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: updateCustomer - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}

			resolve(rows);
		});
	});
}

exports.updateSingleCustomer = async(uispdbID, zoho_client_id) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `UPDATE UISPData SET CustomerIDZoho = '${zoho_client_id}', IsSingleCustomer = 1, IsCreatedZoho = 1 WHERE uispdbID = ${uispdbID}`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: updateSingleCustomer - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

//Limpieza de datos de clientes en Zoho Subscriptions
exports.getCreatedClients = async() => {
  //SELECT * FROM uispData WHERE IsCreatedZoho = 1
  //SELECT * FROM uispData WHERE uispdbID = 7000
  return new Promise((resolve, reject) => {
    sql.query(connectionString, 'SELECT * FROM uispData WHERE IsCreatedZoho = 1', (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getAllData - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

exports.resetCustomer = async(uispdbID) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `UPDATE uispData SET CustomerIDZoho = null, ZohoSubscriptionID = null, IsSingleCustomer = 0, IsCreatedZoho = 0, IsDebtUpdated = 0 WHERE uispdbID = ${uispdbID}`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getAllData - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

//Clientes que requieren actualización
exports.getClientsWithDebt = async() => {
  //SELECT * FROM uispData WHERE IsCreatedZoho = 1
  //SELECT * FROM uispData WHERE uispdbID = 7000
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `SELECT * FROM uispData WHERE AccountOutstanding > '0' AND CustomerIDZoho IS NOT NULL AND IsDebtUpdated = 0`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getClientsWithDebt - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

exports.updateClientDebt = async(CustomerIDUISP) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `UPDATE uispData set IsDebtUpdated = 1 WHERE CustomerIDUISP = ${CustomerIDUISP}`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: updateClientDebt - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

//Actualización de campos de suscripciones
exports.updateClientSubscriptions = async(uispdbID, subscriptions_id) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `UPDATE UISPData SET ZohoSubscriptionID = '${subscriptions_id}' WHERE uispdbID = ${uispdbID}`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: updateClientSubscriptions - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}