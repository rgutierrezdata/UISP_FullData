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
exports.insertClient = async (firstName, lastName, companyName, displayName, email, username, phone, country, state, city, street, zip, customerID_UISP, clientType, clientTypeName_UISP, clientTypeName_Zoho, subscription_status, subscription_status_name_UISP, subscription_status_name_Zoho, subscription_price, subscription_discounts, currency_code, subscription_codes, subscription_description, account_balance, account_credit, account_outstanding, UISP_subscription_ID, service_plan_period_ID, service_plan_period, latitude, longitude, google_maps_url, node, organizationName, servicePlanID, activeFrom, RIF) => {
  var bool = true;

  const query = `
    INSERT INTO table_script_1
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
      SubscriptionDiscounts,
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
      ${subscription_discounts},   
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
    
    sql.query(connectionString, `SELECT * FROM uispMigrationData WHERE uispdbID = 9585`, (err, rows) => {
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
    sql.query(connectionString, `UPDATE uispMigrationData SET CustomerIDZoho = '${zoho_client_id}', IsCreatedZoho = 1 WHERE uispdbID = ${uispdbID}`, (err, rows) => {
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
    sql.query(connectionString, `UPDATE uispMigrationData SET CustomerIDZoho = '${zoho_client_id}', IsSingleCustomer = 1, IsCreatedZoho = 1 WHERE uispdbID = ${uispdbID}`, (err, rows) => {
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
    sql.query(connectionString, `SELECT  * FROM uispMigrationData WHERE (LEN(ServicePlanID) - LEN(REPLACE(ServicePlanID,',','')) + 1) < (DATALENGTH(ZohoSubscriptionID) - DATALENGTH(REPLACE(CAST(ZohoSubscriptionID AS VARCHAR(MAX)),',','')) + 1)`, (err, rows) => {
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
    sql.query(connectionString, `UPDATE uispMigrationData SET CustomerIDZoho = null, ZohoSubscriptionID = null, IsSingleCustomer = 0, IsCreatedZoho = 0, IsDebtUpdated = 0 WHERE uispdbID = ${uispdbID}`, (err, rows) => {
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
    sql.query(connectionString, `SELECT * FROM uispMigrationDataFixes WHERE AccountOutstanding > '0' AND CustomerIDZoho IS NOT NULL AND IsDebtUpdated = 0`, (err, rows) => {
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
    sql.query(connectionString, `UPDATE uispMigrationData set IsDebtUpdated = 1 WHERE CustomerIDUISP = ${CustomerIDUISP}`, (err, rows) => {
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
    sql.query(connectionString, `UPDATE uispMigrationData SET ZohoSubscriptionID = '${subscriptions_id}' WHERE uispdbID = ${uispdbID}`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: updateClientSubscriptions - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

//Función para traer por correo a los usuarios pendientes por migrar
exports.getPendingClients = async() => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `SELECT Email, CustomerIDUISP FROM uispMigrationData WHERE IsCreatedZoho = 0 AND Email !='facturacion@fulldata.com.ve' AND Email !='ESTEFANY¿R¿3¿@HOTMAIL.COM'`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: updateClientSubscriptions - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

//Función para traer clientes de UISP filtrando por correo
exports.getClientsByEmailUISP = async(email) => {
  const baseUrl = process.env.baseUrl;
  const URL = `${baseUrl}/clients?email=${email}`;

  const headers = {
    "X-Auth-App-Key": process.env.appKey
  }

  try {
    const data = await axios.get(URL, {headers: headers});
    return data.data;
  }
  catch(error) {
    logger.log('info',`File: uisp.js - Function Name: getClientsByEmailUISP - Error ${error}`);
    console.log("GET_CLIENTS_BY_EMAIL_UISP_DATA ===>", error);
    return error;
  }
}

//Función para obtener clientes cuyas suscripciones necesitan actualización
exports.getClientsForUpdate = async() => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `SELECT * FROM uispMigrationData WHERE uispdbID = 8652`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getClientsForUpdate - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

exports.updateSubscriptions = async(zoho_string, customer_id_zoho) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `UPDATE uispMigrationData SET ZohoSubscriptionID = '${zoho_string}' WHERE CustomerIDZoho = ${customer_id_zoho}`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getClientsForUpdate - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

//Función para obtener a clientes correspondientes al mes de Marzo para actualización de Próxima factura
exports.getClientsToUpdateNextBillingAt = async() => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `SELECT * FROM uispMigrationData WHERE uispdbID = 428`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getClientsForUpdate - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

exports.updateBillingDate = async(uispdbID) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `UPDATE uispMigrationData SET IsBillingUpdated = 1 WHERE uispdbID=${uispdbID}`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getClientsForUpdate - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

exports.getMarchClients = async() => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `
      SELECT * FROM uispMigrationDataFixes
      WHERE ActiveFrom LIKE '%2022-03%'
      AND ActiveFrom NOT LIKE '%2022-03-01%'
      AND ActiveFrom NOT LIKE '%2022-03-02%'
      AND ActiveFrom NOT LIKE '%2022-03-03%'
      AND ActiveFrom NOT LIKE '%2022-03-04%'
      AND ActiveFrom NOT LIKE '%2022-03-05%'
      AND ActiveFrom NOT LIKE '%2022-03-06%'
      AND ActiveFrom NOT LIKE '%2022-03-07%'
      AND ActiveFrom NOT LIKE '%2022-03-08%'
      AND ActiveFrom NOT LIKE '%2022-03-09%'
      AND uispdbID BETWEEN 336 AND 351
      ORDER BY ActiveFrom ASC
    `, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getMarchClients - Error ${err}`);;
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

exports.updateMarchClientUISP = async(id, subscriptions_prev_info, invoices_prev_info, inv_details_prev_info, has_credit, is_updated) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `
    UPDATE uispMarchClientsFixes 
    SET SubscriptionPrevInfo = '${subscriptions_prev_info}', 
    InvoicesPrevInfo = '${invoices_prev_info}', 
    InvoicesDetailPrevInfo = '${inv_details_prev_info}', 
    HasCredit = ${has_credit}, 
    IsUpdated = ${is_updated} 
    WHERE uispdbID = ${id}`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: updateMarchClientUISP - Error ${err}`);;
				return reject("Error");
			}
			resolve(rows);
		});
	});
}

exports.getClientsForDates = async() => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `
      SELECT * 
      FROM uispMarchClients 
      WHERE ActiveFrom LIKE '%2022-03%'
      AND ActiveFrom NOT LIKE '%2022-03-01%'
      AND ActiveFrom NOT LIKE '%2022-03-02%'
      AND ActiveFrom NOT LIKE '%2022-03-03%'
      AND ActiveFrom NOT LIKE '%2022-03-04%'
      AND ActiveFrom NOT LIKE '%2022-03-05%'
      AND ActiveFrom NOT LIKE '%2022-03-06%'
      AND ActiveFrom NOT LIKE '%2022-03-07%'
      AND ActiveFrom NOT LIKE '%2022-03-08%'
      AND ActiveFrom NOT LIKE '%2022-03-09%'
      AND ActiveFrom NOT LIKE '%2022-03-10%'
      AND ActiveFrom NOT LIKE '%2022-03-11%' 
      AND HasCredit = 1
      ORDER BY ActiveFrom ASC
    `, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getClientsForDates - Error ${err}`);;
				return reject("Error");
			}
			resolve(rows);
		});
	});
  
}

exports.insertDate = async(display_name, string_date) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `INSERT INTO datesTable (DisplayName, date) VALUES ('${display_name}', '${string_date}')`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getClientsForUpdate - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});

}

exports.getPaymentClients = async() => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `SELECT * FROM uispMarchClients WHERE HasCredit = 1`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: getClientsForUpdate - Error ${err}`);
				//return reject(respose.responseFromServer().error.SYSTEM_ERROR);
				return reject("Error");
			}
			resolve(rows);
		});
	});

}

exports.insertPaymentLog = async(customer_name, date, invoice_number, reference_number, payment_mode, total, invoice_status) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `
    INSERT INTO payment_logs (customer_name, date, invoice_number, reference_number, payment_mode, total, status) 
    VALUES ('${customer_name}', ${date}, '${invoice_number}', ${reference_number}, ${payment_mode}, '${total}', '${invoice_status}')`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: insertPaymentLog - Error ${err}`);
				return reject("Error");
			}
			resolve(rows);
		});
	});

}

exports.obtainPendingClients = async() => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `SELECT * FROM table_script_2 WHERE CustomerIDZoho = 2968226000001344562`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: obtainPendingClients - Error ${err}`);
				return reject("Error");
			}
			resolve(rows);
		});
	});

}

exports.updateLeClient = async(id, subscriptions_prev_info, invoices_prev_info, inv_details_prev_info, pay_details_prev_info, has_credit, is_updated) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `
    UPDATE table_script_2 
    SET SubscriptionPrevInfo = '${subscriptions_prev_info}', 
    InvoicesPrevInfo = '${invoices_prev_info}', 
    InvoicesDetailPrevInfo = '${inv_details_prev_info}', 
    PaymentsPrevInfo = '${pay_details_prev_info}',
    HasCredit = ${has_credit}, 
    IsUpdated = ${is_updated} 
    WHERE uispdbID = ${id}
    `, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: obtainPendingClients - Error ${err}`);
				return reject("Error");
			}
			resolve(rows);
		});
	});

}

exports.obtainIVAClients = async() => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `SELECT * FROM table_script_3 WHERE CustomerIDZoho = 2968226000001113745`, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: obtainIVAClients - Error ${err}`);
				return reject("Error");
			}
			resolve(rows);
		});
	});

}

exports.updateIVAClient = async(id, subscriptions_prev_info, invoices_prev_info, inv_details_prev_info, pay_details_prev_info, has_credit, is_updated) => {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, `
    UPDATE table_script_3 
    SET SubscriptionPrevInfo = '${subscriptions_prev_info}', 
    InvoicesPrevInfo = '${invoices_prev_info}', 
    InvoicesDetailPrevInfo = '${inv_details_prev_info}', 
    PaymentsPrevInfo = '${pay_details_prev_info}',
    HasCredit = ${has_credit}, 
    IsUpdated = ${is_updated} 
    WHERE uispdbID = ${id}
    `, (err, rows) => {
			if(err) {
				logger.log('error',`Folder: uisp - File: uisp.js - Function_Name: updateIVAClient - Error ${err}`);
				return reject("Error");
			}
			resolve(rows);
		});
	});

}



