const logger = require('../../../config/logger.js');
const sql = require("mssql");

exports.retrieveBillingConfig = async(company_api_key) => {
  let pool;

  try {
    pool = await sql.connect(process.env['CONNECTION_STRING_GOSUITE']); 

    let result = await pool.request()
    .input('company_api_key', sql.VarChar, company_api_key)
    .query(`DECLARE @id INT; 
      SET @id = (SELECT IDCompany FROM company WHERE API_KEY LIKE @company_api_key)
      SELECT BillingSystemID AS 'billing_system_id', IntegrationConfig AS 'integration_config'
      FROM company_integration
      WHERE CompanyID = @id AND IsActive = 1`
    );

    return result.recordset[0];

  }
  catch(error) {
    logger.log('info',`File: configuration.js - Function Name: retrieveBillingConfig - Error ${error}`);
    console.log("RETRIEVE_BILLING_CONFIG_ERROR ===> ", error);
  }
}

exports.insertZohoNewConfig = async (zoho_config, company_api_key) => {
  let pool;

  try {
    pool = await sql.connect(process.env['CONNECTION_STRING_GOSUITE']); 

    let result = await pool.request()
    .input('company_api_key', sql.VarChar, company_api_key)
    .input('IntegrationConfig', sql.VarChar, zoho_config)
    .query(`DECLARE @id INT; 
      SET @id = (SELECT IDCompany FROM company WHERE API_KEY LIKE @company_api_key)
      UPDATE company_integration SET IntegrationConfig = @IntegrationConfig 
      WHERE CompanyID = @id AND IsActive = 1`
    );

    return result.rowsAffected[0];
  }
  catch(error) {
    logger.log('info',`File: configuration.js - Function Name: insertZohoNewConfig - Error ${error}`);
    console.log("INSERT_ZOHO_NEW_CONFIG_ERROR ===> ", error);
  }
}