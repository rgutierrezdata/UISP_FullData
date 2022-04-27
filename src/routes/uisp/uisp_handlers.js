const resForm = require('../../response/responseForm');  
const response = require('../../response/response'); 
const uisp = require('./uisp');
const zoho = require('./libs/zoho');
const configuration = require('./models/configuration');
const axios = require('axios');
const logger = require('../../config/logger');
const dayjs = require('dayjs');

module.exports.fetchData = async (req, res) => {
  //Obtener data de UISP con los clientes
  var SYS = false;
  let uisp_clients = [];
  let cantidad_clientes = 0;

  let offset = 8899;
  const limit = 1;

  //Atrapando toda la data de clientes en UISP
  
  while(!SYS) {
    uisp_clients = [];
    const data = await uisp.getClientsUISP(offset, limit);
    
    uisp_clients = uisp_clients.concat(data);
    cantidad_clientes = cantidad_clientes + uisp_clients.length;

    if (data.length === 0) {
      SYS = true;
      console.log("Obtención de data finalizada");
      console.log("CANTIDAD_TOTAL_USUARIOS ===>", cantidad_clientes);
    }
    else {
      offset += limit;
    }

    if (offset >= 0) {
      SYS = true;
      console.log("Obtención de data finalizada");
      console.log("CANTIDAD_TOTAL_USUARIOS ===>", uisp_clients.length);
    }

    /*
      uisp_clients = [];
      const pending_users = await uisp.getPendingClients();
      for(let user of pending_users) {
        const data = await uisp.getClientsByEmailUISP(user.Email);
        uisp_clients = uisp_clients.concat(data)
        console.log("CANTIDAD ===>", uisp_clients.length);
      }
    */

    let inserted_client = 0;
    //Procesamiento de la información para insertar en base de datos
    for(let client of uisp_clients) {
      let firstName = (client.firstName) ? `'${client.firstName.trim().replace("'", "''")}'` : null;
      let lastName = (client.lastName) ? `'${client.lastName.trim().replace("'", "''")}'` : null;
      let companyName = (client.companyName) ? `'${client.companyName.trim().replace("'", "''")}'`: null;
      //Análisis para display name
      let displayName = (client.clientType === 1) ? `'${client.firstName.trim().replace("'", "''") + " " + client.lastName.trim().replace("'", "''")}'` : `'${client.companyName.trim().replace("'", "''")}'`;
      //Arreglo con informaciones varias ===> clientId, email, phone
      let contacts_array = client.contacts;
      //Correo electrónico
      let email = "";

      if(client.organizationId === 12) {
        email = `'facturacion@fulldata.com.ve'`;
      }
      else {
        email = (contacts_array[0].email) ? `'${contacts_array[0].email.trim()}'` : `'facturacion@fulldata.com.ve'`;
      }

      let username = (client.username) ? `'${client.username.trim().replace("'", "''")}'` : null;
      
      //Análisis para construcción de string con teléfonos
      let phone = null;
      let telefono = "";
  
      for(let i in contacts_array) {
        if(contacts_array[i].phone !== null) {
          if(telefono.length === 0) {
            telefono = contacts_array[i].phone.trim();
          }
          else {
            telefono = telefono + ", " + contacts_array[i].phone.trim();
          }
        }
      }
      
      phone = (telefono !== "") ? `'${telefono}'` : null;

      if(telefono.length > 50) {
        let telefonos_array = telefono.split(",");
        phone = "";

        for(let i = 0; i <= 2; i++) {
          if(phone.length === 0) {
            phone = telefonos_array[i];
          }
          else {
            phone = phone + "," + telefonos_array[i];
          }
        }
        phone = `'${phone}'`;

        if(phone.length > 50) {
          phone = `'${telefono.substring(0,50)}'`;
        }
      }
      
    
      let country = "'Venezuela'";
      let state = "'Zulia'";
      let city = "'Maracaibo'";
  
      //Validación para la dirección
      let street1 = client.street1;
      let street2 = client.street2;
      let street = null;
  
      if(street1 !== null && street2 !== null) {
        street = `'${client.street1.trim().replace("'", "''") + " " + client.street2.trim().replace("'", "''")}'`;
      }
      else if(street1 !== null) {
        street = `'${client.street1.trim().replace("'", "''")}'`;
      }
      else if(street2 !== null) {
        street = `'${client.street2.trim().replace("'", "''")}'`;
      }
      else {
        street = "";
      }
  
      //Código postal
      let zip = (client.zipCode) ? `'${client.zipCode.trim()}'` : null;
  
      /*
        Análisis fecha de registro del cliente
        let regDate = client.registrationDate.trim();
        let registrationDate = regDate.substring(0, regDate.indexOf("T")).trim();
      */
  
      //Análisis obtención del RIF
      let attributes_array = client.attributes;
      let RIF = null;
      for(attribute of attributes_array) {
        if(attribute.key === "rIF") {
          RIF = `'${attribute.value.trim()}'`;
        }
      }
  
      //ID de cliente de UISP
      let customerID_UISP = (contacts_array[0].clientId) ? contacts_array[0].clientId : null;
      //CustomerID_Zoho ===> necesario actualizar una vez realizada la migración del cliente
  
      //Tipo de cliente 1. Natural(individual); 2. Jurídico (business)
      let clientType = (client.clientType) ? client.clientType : null;

      let account_balance = "";
      let account_credit = "";
      let account_outstanding = "";

      //accountBalance ===> account_balance
      //accountCredit ===> account_credit
      account_balance = (client.accountBalance !== null) ? `'${client.accountBalance}'` : null;
      account_credit = (client.accountCredit !== null) ? `'${client.accountCredit}'` : null;
      account_outstanding = (client.accountOutstanding !== null) ? `'${client.accountOutstanding}'` : null;
     

      /*
        Análisis de acuerdo a tipo de cliente
        1. Natural ===> individual
        2. Jurídico ===> business
  
        Variables de impuestos
        Estos campos ya no van, solamente se debe crear cada cliente en base a persona natural o jurídica
        1 ---> natural(individual); 
        2---> jurídico (business);
  
        let clientTypeName_UISP = "";
        let clientTypeName_Zoho = "";
        let is_taxable = "";
        let tax_id = "";
        let tax_name = "";
        let tax_percentage = "";
        let tax_authority_id = "";
        let tax_exemption_id = "";
        let tax_exemption_code = "";
        let tax_authority_name = "";
  
        is_taxable = 0;
        tax_id = "";
        tax_name = "";
        tax_percentage = "";
        tax_authority_id = "";
        tax_exemption_id = "identificador de exepción";
        tax_exemption_code = "código de exepción";
        tax_authority_name = "";
  
        is_taxable = 1;
        tax_id = "código de impuesto";
        tax_name = "nombre del impuesto";
        tax_percentage = 16 //agregar valor real de tasa de impuestos a utilizar;
        tax_authority_id = "identificador de autoridad de impuestos";
        tax_exemption_id = "";
        tax_exemption_code = "";
        tax_authority_name = "nombre de autoridad de impuestos";
  
        Impuestos (taxes)
      */
  
      if(clientType === 1) {
        clientTypeName_UISP = "'natural'";
        clientTypeName_Zoho = "'individual'";
      }
      else {
        clientTypeName_UISP = "'jurídico'";
        clientTypeName_Zoho = "'business'";
      }
  
      //Análisis del estado de la subscripción
      const user_service_info = await uisp.getClientService(customerID_UISP);
  
      //Validación en caso de que no exista data de la subscripción
      let subscription_status = "";
      let subscription_status_name_UISP = "";
      let subscription_status_name_Zoho = "";
      let subscription_price = "";
      let subscription_codes = "";
      let subscription_description = "";
      let currency_code = "";

      let servicePlanID = "";
      let activeFrom = "";

      //Campos añadidos a la lógica de migración para uso en integraciones con Zoho
      //El campo ZohoSubscriptionsID se debe llenar durante la lógica de migración
      let UISP_subscription_ID = "";
      let service_plan_period_ID = "";
      let service_plan_period = "";

      //Campo de descuentos al precio de las subscripciones
      let subscriptionsDiscounts = "";
      
      if(user_service_info.length !== 0) {
        //Extraer información de todas las subscripciones
  
        //subscription_status
        for(subscription of user_service_info) {
          if(subscription.status) {
            if(subscription_status.length === 0) {
              subscription_status = subscription.status;
            }
            else {
              subscription_status = subscription_status + "," + subscription.status;
            }
          }
        }
  
        //servicePlanID
        for(subscription of user_service_info) {
          if(subscription.servicePlanId) {
            if(servicePlanID.length === 0) {
              servicePlanID = subscription.servicePlanId;
            }
            else {
              servicePlanID = servicePlanID + "," + subscription.servicePlanId;
            }
          }
        }

        //SubscriptionPrice ===> subscription_price
        for(subscription of user_service_info) {
          if(subscription.price !== null) {
            if(subscription_price.length === 0) {
              subscription_price = subscription.price;
            }
            else {
              subscription_price = subscription_price + "," + subscription.price;
            }
          }
        }

        //SubscriptionDescription
        for(subscription of user_service_info) {
          if(subscription.servicePlanName) {
            if(subscription_description.length === 0) {
              subscription_description = subscription.servicePlanName.trim().replace(",", "");
            }
            else {
              subscription_description = subscription_description + "," + subscription.servicePlanName.trim().replace(",", "");
            }
          }
        }

        //ActiveFrom
        for(subscription of user_service_info) {
          if(subscription.activeFrom) {
            if(activeFrom.length === 0) {
              activeFrom = subscription.activeFrom.substring(0, subscription.activeFrom.indexOf("T")).trim();
            }
            else {
              activeFrom = activeFrom + "," + subscription.activeFrom.substring(0, subscription.activeFrom.indexOf("T")).trim();
            }
          }
        }

        //CurrencyCode ===> currency_code
        for(subscription of user_service_info) {
          if(subscription.currencyCode) {
            if(currency_code.length === 0) {
              currency_code = subscription.currencyCode.trim();
            }
            else {
              currency_code = currency_code + "," + subscription.currencyCode.trim();
            }
          }
        }

        //SubscriptionCodes ===? subscription_codes
        let code_array_ns = [1, 9, 10, 11, 12, 13, 16, 18, 19, 22, 25, 26, 38, 39, 40, 41, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 82, 85, 100, 124, 127, 135, 136, 137, 139, 143, 145, 147, 149, 157, 158, 176, 178, 179, 180, 181, 187, 200, 201, 202, 205, 206, 207, 208, 209, 210, 211, 212, 214, 215, 216, 234, 235, 237, 239, 241, 243];

        for(subscription of user_service_info) {
          let code = "";
          //Selección del código de plan
          if(subscription.servicePlanId) {
            if(code_array_ns.includes(subscription.servicePlanId)) {
              code = "No crear suscripcion";
            }
            else if(subscription.servicePlanId === 2) {
              code ="WC2";
            } 
            else if(subscription.servicePlanId === 3) {
              code ="WC4";
            } 
            else if(subscription.servicePlanId === 4) {
              code ="WC6";
            } 
            else if(subscription.servicePlanId === 5) {
              code ="WC8";
            } 
            else if(subscription.servicePlanId === 6) {
              code ="WC10";
            } 
            else if(subscription.servicePlanId === 17) {
              code ="WC12";
            } 
            else if(subscription.servicePlanId === 20) {
              code ="WC10D";
            } 
            else if(subscription.servicePlanId === 23) {
              code ="WC2D";
            } 
            else if(subscription.servicePlanId === 29) {
              code ="WC12";
            }
            else if(subscription.servicePlanId === 31) {
              code ="WC2";
            }
            else if(subscription.servicePlanId === 32) {
              code ="WC4";
            }
            else if(subscription.servicePlanId === 33) {
              code ="WC6";
            }
            else if(subscription.servicePlanId === 34) {
              code ="WC8";
            }
            else if(subscription.servicePlanId === 35) {
              code ="WC10";
            } 
            else if(subscription.servicePlanId === 89) {
              code ="FRULTRA";
            } 
            else if(subscription.servicePlanId === 104) {
              code ="FRPLUS";
            } 
            else if(subscription.servicePlanId === 107) {
              code ="FCLITE";
            } 
            else if(subscription.servicePlanId === 108) {
              code ="FCPLUS";
            } 
            else if(subscription.servicePlanId === 109) {
              code ="FCPRO";
            } 
            else if(subscription.servicePlanId === 110) {
              code ="FCMEGA";
            } 
            else if(subscription.servicePlanId === 111) {
              code ="FCFULL";
            } 
            else if(subscription.servicePlanId === 114) {
              code ="FRLITE";
            } 
            else if(subscription.servicePlanId === 117) {
              code ="FRULTRA";
            } 
            else if(subscription.servicePlanId === 123) {
              code ="FCULTRA";
            } 
            else if(subscription.servicePlanId === 128) {
              code ="FPPLUS";              
            }
            else if(subscription.servicePlanId === 129) {
              code ="FPMEGA";                
            }
            else if(subscription.servicePlanId === 130) {
              code ="FC300D";
            } 
            else if(subscription.servicePlanId === 146) {
              code ="FR30";
            } 
            else if(subscription.servicePlanId === 150) {
              code ="FR30";
            } 
            else if(subscription.servicePlanId === 151) {
              code ="FRMLITE";
            } 
            else if(subscription.servicePlanId === 153) {
              code ="FRLITE";
            } 
            else if(subscription.servicePlanId === 154) {
              code ="FRLITE";
            } 
            else if(subscription.servicePlanId === 155) {
              code ="FRULTRA";
            } 
            else if(subscription.servicePlanId === 156) {
              code ="FRPLUS";
            } 
            else if(subscription.servicePlanId === 159) {
              code ="FRLITE";
            }
            else if(subscription.servicePlanId === 160) {
              code ="FPPLUS";
            } 
            else if(subscription.servicePlanId === 161) {
              code ="FPMEGA";
            } 
            else if(subscription.servicePlanId === 163) {
              code ="FPMEGA";
            } 
            else if(subscription.servicePlanId === 164) {
              code ="FPPLUS";
            } 
            else if(subscription.servicePlanId === 165) {
              code ="FPLITE";
            } 
            else if(subscription.servicePlanId === 166) {
              code ="FPULTRA";
            } 
            else if(subscription.servicePlanId === 167) {
              code ="FPLITE";
            } 
            else if(subscription.servicePlanId === 168) {
              code ="FPULTRA";
            } 
            else if(subscription.servicePlanId === 173) {
              code ="FPULTRA";
            } 
            else if(subscription.servicePlanId === 174) {
              code ="FPULTRA";
            } 
            else if(subscription.servicePlanId === 175) {
              code ="FPULTRA";
            } 
            else if(subscription.servicePlanId === 182) {
              code ="FPULTRA";
            } 
            else if(subscription.servicePlanId === 183) {
              code ="FPLITE";
            } 
            else if(subscription.servicePlanId === 184) {
              code ="FPPLUS";
            } 
            else if(subscription.servicePlanId === 185) {
              code ="FPMEGA";
            } 
            else if(subscription.servicePlanId === 186) {
              code ="FRLITE";
            } 
            else if(subscription.servicePlanId === 188) {
              code ="FR30";
            } 
            else if(subscription.servicePlanId === 189) {
              code ="FCULTRA";
            } 
            else if(subscription.servicePlanId === 190) {
              code ="FRULTRA";
            } 
            else if(subscription.servicePlanId === 191) {
              code ="FCFULL";
            } 
            else if(subscription.servicePlanId === 192) {
              code ="FCMEGA";
            } 
            else if(subscription.servicePlanId === 193) {
              code ="FCPRO";
            } 
            else if(subscription.servicePlanId === 194) {
              code ="FCPLUS";
            } 
            else if(subscription.servicePlanId === 195) {
              code ="FCLITE";
            } 
            else if(subscription.servicePlanId === 196) {
              code ="FRPLUS";
            } 
            else if(subscription.servicePlanId === 197) {
              code ="FCFULL";
            } 
            else if(subscription.servicePlanId === 203) {
              code ="FPLITE";
            } 
            else if(subscription.servicePlanId === 217) {
              code ="FCFULL";
            } 
            else if(subscription.servicePlanId === 218) {
              code ="FPULTRA";
            } 
            else if(subscription.servicePlanId === 219) {
              code ="FPLITE";
            } 
            else if(subscription.servicePlanId === 220) {
              code ="FPMEGA";
            } 
            else if(subscription.servicePlanId === 221) {
              code ="FPPLUS";
            } 
            else if(subscription.servicePlanId === 222) {
              code ="FRMLITE";
            } 
            else if(subscription.servicePlanId === 223) {
              code ="FRPLUS";
            } 
            else if(subscription.servicePlanId === 224) {
              code ="FRULTRA";
            } 
            else if(subscription.servicePlanId === 225) {
              code ="FRLITE";
            } 
            else if(subscription.servicePlanId === 226) {
              code ="FR30";
            } 
            else if(subscription.servicePlanId === 227) {
              code ="FCULTRA";
            } 
            else if(subscription.servicePlanId === 228) {
              code ="FCMEGA";
            } 
            else if(subscription.servicePlanId === 229) {
              code ="FCPRO";
            } 
            else if(subscription.servicePlanId === 230) {
              code ="FCPLUS";
            } 
            else if(subscription.servicePlanId === 231) {
              code ="FCLITE";
            } 
            else if(subscription.servicePlanId === 233) {
              code ="FPLITE";
            } 
            else if(subscription.servicePlanId === 238) {
              code ="FPULTRA";
            } 
            else if(subscription.servicePlanId === 244) {
              code ="FPLITE";
            }
            else if(subscription.servicePlanId === 246) {
              code ="FC60D";
            }
            else if(subscription.servicePlanId === 247) {
              code = "WC20D";
            }
            else if(subscription.servicePlanId === 252) {
              code = "WC16";
            }
            else if(subscription.servicePlanId === 253) {
              code = "FPLITE";
            }
            else if(subscription.servicePlanId === 254) {
              code = "FPMEGA";
            }
            else if(subscription.servicePlanId === 255) {
              code = "FPMEGA";
            }
            else if(subscription.servicePlanId === 267) {
              code = "FPLIT";
            }
            else if(subscription.servicePlanId === 268) {
              code = "FPPLUS";
            }
            else if(subscription.servicePlanId === 269) {
              code = "FPMEGA";
            }
            else if(subscription.servicePlanId === 283) {
              code = "WC60";
            }
            else if(subscription.servicePlanId === 284) {
              code = "WC60";
            }
            else if(subscription.servicePlanId === 285) {
              code = "FPULTRARIAL";
            }
            else if(subscription.servicePlanId === 286) {
              code = "FCEND";
            }
            else if(subscription.servicePlanId === 287) {
              code = "FCSED";
            }
            else if(subscription.servicePlanId === 288) {
              code = "FCGEZD";
            }
            else if(subscription.servicePlanId === 289) {
              code = "FCGEZD";
            }
            else if(subscription.servicePlanId === 290) {
              code = "FCPGEZD";
            }
            else if(subscription.servicePlanId === 291) {
              code = "FCGEZDL";
            }
            else if(subscription.servicePlanId === 292) {
              code = "FCINVH";
            }
            else if(subscription.servicePlanId === 243) {
              code = "FR30";
            }
            else if(subscription.servicePlanId === 248) {
              code = "FRMLITE";
            }
            else if(subscription.servicePlanId === 249) {
              code = "FRLITE";
            }
            else if(subscription.servicePlanId === 250) {
              code = "FRPLUS";
            }
            else if(subscription.servicePlanId === 251) {
              code = "FRULTRA";
            }
            else if(subscription.servicePlanId === 256) {
              code = "FPULTRA";
            }
            else if(subscription.servicePlanId === 257) {
              code = "FCULTRA";
            }
            else if(subscription.servicePlanId === 258) {
              code = "FCFULL";
            }
            else if(subscription.servicePlanId === 259) {
              code = "FCMEGA";
            }
            else if(subscription.servicePlanId === 260) {
              code = "FCPRO";
            }
            else if(subscription.servicePlanId === 261) {
              code = "FCPLUS";
            }
            else if(subscription.servicePlanId === 262) {
              code = "FCLITE";
            }
            else if(subscription.servicePlanId === 263) {
              code = "FRMLITE";
            }
            else if(subscription.servicePlanId === 264) {
              code = "FRLITE";
            }
            else if(subscription.servicePlanId === 265) {
              code = "FRPLUS";
            }
            else if(subscription.servicePlanId === 266) {
              code = "FRULTRA";
            }
            else if(subscription.servicePlanId === 270) {
              code = "FPULTRA";
            }
            else if(subscription.servicePlanId === 271) {
              code = "FCULTRA";
            }
            else if(subscription.servicePlanId === 272) {
              code = "FCFULL";
            }
            else if(subscription.servicePlanId === 273) {
              code = "FCMEGA";
            }
            else if(subscription.servicePlanId === 274) {
              code = "FCPRO";
            }
            else if(subscription.servicePlanId === 275) {
              code = "FCPLUS";
            }
            else if(subscription.servicePlanId === 276) {
              code = "FCLITE";
            }
            else if(subscription.servicePlanId === 279) {
              code = "WC6";
            }
            else if(subscription.servicePlanId === 280) {
              code = "WC8";
            }
            else if(subscription.servicePlanId === 281) {
              code = "FRLITE";
            }
          }

          //Construcción de string
          if(subscription_codes.length === 0) {
            subscription_codes = code;
          }
          else {
            subscription_codes = subscription_codes + "," + code;
          }
        }

        //Ids de suscripciones en UISP
        for(subscription of user_service_info) {
          if(subscription.id !== null) {
            if(UISP_subscription_ID.length === 0) {
              UISP_subscription_ID = subscription.id;
            }
            else {
              UISP_subscription_ID = UISP_subscription_ID + "," + subscription.id;
            }
          }
        }

        //Service plan period id
        for(subscription of user_service_info) {
          if(subscription.servicePlanPeriodId !== null) {
            if(service_plan_period_ID.length === 0) {
              service_plan_period_ID = subscription.servicePlanPeriodId;
            }
            else {
              service_plan_period_ID = service_plan_period_ID + "," + subscription.servicePlanPeriodId;
            }
          }
        }

        //Service plan period
        for(subscription of user_service_info) {
          if(subscription.servicePlanPeriod !== null) {
            if(service_plan_period.length === 0) {
              service_plan_period = subscription.servicePlanPeriod;
            }
            else {
              service_plan_period = service_plan_period + "," + subscription.servicePlanPeriod;
            }
          }
        }

        //discountValue
        for(subscription of user_service_info) {
          if(subscription.discountValue !== null) {
            if(subscriptionsDiscounts.length === 0) {
              subscriptionsDiscounts = subscription.discountValue;
            }
            else {
              subscriptionsDiscounts = subscriptionsDiscounts + "," + subscription.discountValue;
            }
          }
          else {
            if(subscriptionsDiscounts.length === 0) {
              subscriptionsDiscounts = '0';
            }
            else {
              subscriptionsDiscounts = subscriptionsDiscounts + "," + '0';
            }

          }
        }

        //Transformación final subscription_status, servicePlanID, activeFrom
        subscription_status = `'${subscription_status}'`;
        subscription_price = `'${subscription_price}'`;
        currency_code = `'${currency_code}'`;
        subscription_codes = `'${subscription_codes}'`;
        subscription_description = `'${subscription_description}'`
        servicePlanID = `'${servicePlanID}'`;
        activeFrom = `'${activeFrom}'`;
        UISP_subscription_ID = `'${UISP_subscription_ID}'`
        service_plan_period_ID = `'${service_plan_period_ID}'`
        service_plan_period = `'${service_plan_period}'`
        subscriptionsDiscounts = `'${subscriptionsDiscounts}'`
    
        //console.log("SUBSCRIPTION_STATUS ===>",subscription_status);
        //console.log("SERVICE_PLAND_ID ===>",servicePlanID);
        //console.log("ACTIVE_FROM ===>",activeFrom);
  
        //subscription_status = (user_service_info.status) ? user_service_info.status : null;
        //servicePlanID = (user_service_info.servicePlanId) ? user_service_info.servicePlanId : null;
        //activeDate = (user_service_info.activeFrom) ? user_service_info.activeFrom : null;
      
        //Estado de la subscripción
        for(subscription of user_service_info) {
  
          if(subscription.status === 1) {
            subscription_status_name_UISP = (subscription_status_name_UISP.length === 0) ? "Active" : subscription_status_name_UISP + "," + "Active";
            subscription_status_name_Zoho = (subscription_status_name_Zoho.length === 0) ? "Live" : subscription_status_name_Zoho + "," + "Live";
          }
          else if (subscription.status === 2) {
            subscription_status_name_UISP = (subscription_status_name_UISP.length === 0) ? "Ended" : subscription_status_name_UISP + "," + "Ended";
            subscription_status_name_Zoho = (subscription_status_name_Zoho.length === 0) ? "Cancelled" : subscription_status_name_Zoho + "," + "Cancelled";
          }
          else {
            subscription_status_name_Zoho = (subscription_status_name_Zoho.length === 0) ? "Expired" : subscription_status_name_Zoho + "," + "Expired";
  
            switch(subscription.status) {
              case 3:
                subscription_status_name_UISP = (subscription_status_name_UISP.length === 0) ? "Suspended" : subscription_status_name_UISP + "," + "Suspended";
              break;
      
              case 4:
                subscription_status_name_UISP = (subscription_status_name_UISP.length === 0) ? "Prepared blocked" : subscription_status_name_UISP + "," + "Prepared blocked";
              break;
      
              case 5:
                subscription_status_name_UISP = (subscription_status_name_UISP.length === 0) ? "Obsolete" : subscription_status_name_UISP + "," + "Obsolete";
              break;
      
              case 6:
                subscription_status_name_UISP = (subscription_status_name_UISP.length === 0) ? "Deferred" : subscription_status_name_UISP + "," + "Deferred";
              break;
      
              case 7:
                subscription_status_name_UISP = (subscription_status_name_UISP.length === 0) ? "Quoted" : subscription_status_name_UISP + "," + "Quoted";
              break;
            }
          }
  
        }
  
        subscription_status_name_UISP = `'${subscription_status_name_UISP}'`;
        subscription_status_name_Zoho = `'${subscription_status_name_Zoho}'`;
  
        //console.log("SUBSCRIPTION_STATUS_NAME_UISP ===>",subscription_status_name_UISP);
        //console.log("SUBSCRIPTION_STATUS_NAME_ZOHO ===>",subscription_status_name_Zoho);
  
        //ServicePlanID y activeFrom ya contemplados en validación de los datos de la subscripción
        //console.log("firstName ===>", firstName);
        //console.log("lastName ===>", lastName);
        //console.log("companyName ===>", companyName);
        //console.log("displayName ===>", displayName);
        //console.log("email ===>", email);
        //console.log("phone ===>", phone);
        //console.log("country ===>", country);
        //console.log("state, city ===>", state, city);
        //console.log("street ===>", street);
        //console.log("zip ===>", zip);
        //console.log("customerID_UISP ===>", customerID_UISP);
        //console.log("clientType ===>", clientType);
        //console.log("clientTypeName_UISP ===>", clientTypeName_UISP);
        //console.log("clientTypeName_Zoho ===>", clientTypeName_Zoho);
        //console.log("subscription_status ===>", subscription_status);
        //console.log("subscription_status_name_UISP ===>", subscription_status_name_UISP);
        //console.log("subscription_status_name_Zoho ===>", subscription_status_name_Zoho);
        //console.log("latitude ===>", latitude);
        //console.log("longitude ===>", longitude);
        //console.log("google_maps_url ===>", google_maps_url);
        //console.log("node ===>", node); 
        //console.log("servicePlanID ===>", servicePlanID);
        //console.log("activeFrom ===>", activeFrom);
        //console.log("RIF ===>", RIF);
  
      }
      else {
        subscription_status = null;
        subscription_status_name_UISP = null;
        subscription_status_name_Zoho = null;
        subscription_price = null;
        currency_code = null;
        subscription_codes = null;
        subscription_description = null;
        servicePlanID = null;
        activeFrom = null;
        UISP_subscription_ID = null;
        service_plan_period_ID = null;
        service_plan_period = null;
        subscriptionsDiscounts = null;
      }
      
      //Custom fields
      let latitude = (client.addressGpsLat) ? client.addressGpsLat : null;
      let longitude = (client.addressGpsLon) ? client.addressGpsLon : null;
  
      let google_maps_url = null;
        
      if (latitude && longitude) {
        google_maps_url = `'https://www.google.com/maps?q=${latitude},${longitude}'`;
      }
  
      let node = (client.organizationId) ? client.organizationId : null;
      let organizationName = (client.organizationName) ? `'${client.organizationName.trim()}'` : null;
  
      //Insertar cliente en base de datos
      const insert_client = await uisp.insertClient(firstName, lastName, companyName, displayName, email, username, phone, country, state, city, street, zip, customerID_UISP, clientType, clientTypeName_UISP, clientTypeName_Zoho, subscription_status, subscription_status_name_UISP, subscription_status_name_Zoho, subscription_price, subscriptionsDiscounts, currency_code, subscription_codes, subscription_description, account_balance, account_credit, account_outstanding, UISP_subscription_ID, service_plan_period_ID, service_plan_period, latitude, longitude, google_maps_url, node, organizationName, servicePlanID, activeFrom, RIF);
  
      if(insert_client) {
        inserted_client = inserted_client + 1;
        console.log("CLIENTES INSERTADOS:", inserted_client);
      }
      else {
        logger.log('info',`File: uisp_handlers.js - Function Name: fetchData - customerID_UISP: ${customerID_UISP} no insertado`);
        console.log("ERROR ===>", customerID_UISP);
      }
    }
  
    /*
    const data = await admin.getCompaniesData();
  
    if(!data) {
      res.send(resForm.error(response.responseFromServer(lang).error.SYSTEM_ERROR));
    }
    else {
  
      res.send(resForm.success(data));
    }
    */
  }
}

module.exports.migrateData = async (_, res) => {

  //Obtener la data de clientes alojada en base de datos
  const uisp_clients = await uisp.getAllData()
	.then(data => {
    return data;
	})
	.catch(err => {
    console.log("ERROR_GETTING_ALL_DATA ===>", err);
		logger.log('error',`File: uisp_hanlders.js - Function Name: migrateData - Error ${err}`);
		//res.send( resForm.error(response.responseFromServer().error.EMAIL_USER_NOT_REGISTERED) );
	})

  console.log("LISTA_CLIENTES ===>", uisp_clients.length);

  //Crear clientes en Zoho Subscriptions
  client_counter = 0;

  let timer = setInterval(function(){ 
    //console.log("CLIENTE ===>", client_counter);
    processClient(uisp_clients[client_counter]);
    client_counter +=1;
    if(client_counter >= uisp_clients.length) {
      console.log("MIGRACION FINALIZADA");
      clearInterval(timer);
    }
  }, 10000);

  async function processClient(client) {
    //console.log("PROCESAR CLIENTE")
    console.log("INFO CLIENTE ===>", client);
    
    /*** PASO 1: Token para acceder a Zoho ***/
    const billing_config = await configuration.retrieveBillingConfig('63754c44');

    const {billing_system_id: billing_system, integration_config: configString} = billing_config;
    const configJSON = JSON.parse(configString);

    const { 
      organizationid: organizationid, 
      domain_url: domain_url, 
      client_id: client_id,
      client_secret: client_secret,
      redirect_url: redirect_url,
      refresh_token: refresh_token, 
      created_at: created_at
      //is_taxable: is_taxable,
      //tax_authority_id: tax_authority_id,
      //tax_authority_name: tax_authority_name,
      //tax_exemption_code: tax_exemption_code,
      //tax_exemption_id: tax_exemption_id 
    } = configJSON;

    let oauthtoken = "";
    console.log("CURRENT_ACCESS_TOKEN ===>", configJSON.oauthtoken);

    //Calculate access token remaining validity time
    const elapsed_time = Date.now() - created_at;
    const remaining_time = 3600000 - elapsed_time;
    const elapsed_min = elapsed_time / 60000;
    const remaining_min = remaining_time / 60000;
    
    console.log('ELAPSED TIME ===>', elapsed_min + ' MIN');
    console.log('REMAINING TIME ===>', remaining_min + ' MIN');

    if(remaining_min <= 5) {
      //Request new access token
      const token_data = await zoho.generateAccessToken(client_id, client_secret, refresh_token);
      
      if(token_data) {
        console.log("GENERATED_ACCESS_TOKEN_DATA ===>", token_data);
        //Available data after request ===> access_token, expires_in, api_domain, token_type 
        const {access_token: access_token} = token_data;
        console.log("ACCESS_TOKEN ===>", access_token);
        const new_created_at = Date.now().toString();
        //Insert new config to database
        const config = {
          "organizationid"    : organizationid,
          "oauthtoken"        : access_token,
          "domain_url"        : domain_url,
          "client_id"         : client_id,
          "client_secret"     : client_secret,
          "redirect_url"      : redirect_url,
          "refresh_token"     : refresh_token,
          "created_at"        : new_created_at
          //"is_taxable"        : is_taxable,
          //"tax_authority_id"  : tax_authority_id,
          //"tax_authority_name": tax_authority_name,
          //"tax_exemption_code": tax_exemption_code,
          //"tax_exemption_id"  : tax_exemption_id
        }
        
        const zoho_config = JSON.stringify(config);
        
        console.log("NEW_ZOHO_CONFIG ===>", config);

        const data = await configuration.insertZohoNewConfig(zoho_config, '63754c44');

        if(data) {
          console.log("DATA_INSERT(UPDATE)_ROWS_AFFECTED ===>", data);
          //Set new access_token for current API call
          oauthtoken = access_token;
        }
      }
    }
    else {
      oauthtoken = configJSON.oauthtoken;
    }
    /*** Token para acceder a zoho ***/

    /*** PASO 2: Creación del cliente validando si tiene datos de subscripción ***/
    if(client.SubscriptionStatus === null) {
      //Los campos personalizados se crearán únicamente para la información asociada del cliente más no así de la subscripción
      
      //Análisis para campos personalizados
      let custom_fields = [];
      
      if(client.CustomerIDUISP !== null && client.CustomerIDUISP !== "") {
        let jsn = {
          "label": "ID Cliente UISP",
          "value": client.CustomerIDUISP
        }
        custom_fields.push(jsn);
      }
      
      if(client.RIF !== null && client.RIF !== "") {
        let jsn = {
          "label": "Cedula o RIF",
          "value": client.RIF
        }
        custom_fields.push(jsn);
      }
      
      //JSON de configuración para Zoho ===> Se pasa solamente el objeto Customer para creación de cliente
      let zoho_body = {};

      //Validación para enviar o no enviar los parámetros de nombre y apellido
      if(client.ClientType === 1) {
        zoho_body =  {
          "display_name": client.DisplayName,
          "first_name": client.FirstName,
          "last_name": client.LastName,
          "customer_sub_type": (client.ClientType === 1) ? "individual" : "business",
          "email": client.Email,
          //"email": `testmailbox2022+cliente${client.CustomerIDUISP}@gmail.com`,
          "mobile": client.Phone,
          "billing_address": {
            "country": client.Country,
            "state": client.CountryState,
            "city": client.City,
            "street": client.Street,
            "zip": client.Zip
          },
          "shipping_address": {
            "country": client.Country,
            "state": client.CountryState,
            "city": client.City,
            "street": client.Street,
            "zip": client.Zip
          },
          "custom_fields": custom_fields,
          "is_portal_enabled": true,
          "ach_supported": true
        }
      }
      else {
        zoho_body =  {
          "display_name": client.DisplayName,
          "customer_sub_type": (client.ClientType === 1) ? "individual" : "business",
          "email": client.Email,
          //"email": `testmailbox2022+cliente${client.CustomerIDUISP}@gmail.com`,
          "mobile": client.Phone,
          "billing_address": {
            "country": client.Country,
            "state": client.CountryState,
            "city": client.City,
            "street": client.Street,
            "zip": client.Zip
          },
          "shipping_address": {
            "country": client.Country,
            "state": client.CountryState,
            "city": client.City,
            "street": client.Street,
            "zip": client.Zip
          },
          "custom_fields": custom_fields,
          "is_portal_enabled": true,
          "ach_supported": true
        }

      }
      
      const create_client = await zoho.createCustomerWithoutSubscription(domain_url, organizationid, oauthtoken, zoho_body);

      //Extraer id de cliente de Zoho Subscriptions
      const zoho_client_id = create_client.customer.customer_id;

      //Actualizar registro en base de datos con ID cliente de Zoho
      if(create_client) {
        const update_client = await uisp.updateSingleCustomer(client.uispdbID, zoho_client_id);
        if(update_client) {
          console.log("CLIENTE_ACTUALIZADO ===>", client.uispdbID, zoho_client_id);
        }

        if(client.AccountCredit > 0) {
          let client_details = {
            "customer_id": zoho_client_id,
            "amount": client.AccountCredit,
            "payment_mode": "Saldo UISP",
            "description":"Saldo proveniente de migración UISP"
          }

          await zoho.addCreditViaPayment(domain_url, organizationid, oauthtoken, client_details)
        }
      }
    }
    else {
      console.log("STATUS ===>", "Data de suscripciones detectada", client.ServicePlanID);
      //Variables necesarias para la creación de suscripciones
      let custom_fields_customer = [];
      let custom_fields_subscription = [];
      let client_subscriptions = client.SubscriptionStatus.split(",");
      let client_services = client.ServicePlanID.split(",");
      let services_description = client.SubscriptionDescription.split(",");
      let client_activeFrom = client.ActiveFrom.split(",");
      let zoho_client_id = "";

      let client_prices = client.SubscriptionPrice.split(",");
      let client_codes = client.SubscriptionCodes.split(",");
      let subscription_discounts = client.SubscriptionDiscounts.split(",");
      let subscriptions_id = "";
      //console.log("ENTRO EN LA FUNCION PARA VARIAS SUBSCRIPCIONES");
      //console.log("ESTADOS_SUBSCRIPCION ===>", client_subscriptions);
      //console.log("SERVICIOS_SUBSCRIPCION ===>", client_services);
      //console.log("FECHAS_SUBSCRIPCION ===>", client_activeFrom);

      //Validción para determinar si al menos se debe crear una suscripción
      let code_array_ns = [1, 9, 10, 11, 12, 13, 16, 18, 19, 22, 25, 26, 38, 39, 40, 41, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 82, 85, 100, 124, 127, 135, 136, 137, 139, 143, 145, 147, 149, 157, 158, 176, 178, 179, 180, 181, 187, 200, 201, 202, 205, 206, 207, 208, 209, 210, 211, 212, 214, 215, 216, 234, 235, 237, 239, 241, 243];
      let create_subscription = false;

      for(let i = 0; i < client_subscriptions.length; i++) {
        if((client_subscriptions[i] === "1" || client_subscriptions[i] === "3") && code_array_ns.includes(Number(client_services[i])) === false) {
          console.log("Si hay una suscripcion para crear")
          create_subscription = true;
        }
        else {
          console.log("Esta suscripcion no se crea");
        }
      }
      
      if (create_subscription === false) {
        //Los campos personalizados se crearán únicamente para la información asociada del cliente más no así de la subscripción
      
        //Análisis para campos personalizados
        let custom_fields = [];
      
        if(client.CustomerIDUISP !== null && client.CustomerIDUISP !== "") {
          let jsn = {
            "label": "ID Cliente UISP",
            "value": client.CustomerIDUISP
          }
          custom_fields.push(jsn);
        }
      
        if(client.RIF !== null && client.RIF !== "") {
          let jsn = {
            "label": "Cedula o RIF",
            "value": client.RIF
          }
          custom_fields.push(jsn);
        }
      
        //JSON de configuración para Zoho ===> Se pasa solamente el objeto Customer para creación de cliente
        let zoho_body = {};

        //Validación para enviar o no enviar los parámetros de nombre y apellido
        if(client.ClientType === 1) {
          zoho_body =  {
            "display_name": client.DisplayName,
            "first_name": client.FirstName,
            "last_name": client.LastName,
            "customer_sub_type": (client.ClientType === 1) ? "individual" : "business",
            "email": client.Email,
            //"email": `testmailbox2022+cliente${client.CustomerIDUISP}@gmail.com`,
            "mobile": client.Phone,
            "billing_address": {
              "country": client.Country,
              "state": client.CountryState,
              "city": client.City,
              "street": client.Street,
              "zip": client.Zip
            },
            "shipping_address": {
              "country": client.Country,
              "state": client.CountryState,
              "city": client.City,
              "street": client.Street,
              "zip": client.Zip
            },
            "custom_fields": custom_fields,
            "is_portal_enabled": true,
            "ach_supported": true
          }
        }
        else {
          zoho_body =  {
            "display_name": client.DisplayName,
            "customer_sub_type": (client.ClientType === 1) ? "individual" : "business",
            "email": client.Email,
            //"email": `testmailbox2022+cliente${client.CustomerIDUISP}@gmail.com`,
            "mobile": client.Phone,
            "billing_address": {
              "country": client.Country,
              "state": client.CountryState,
              "city": client.City,
              "street": client.Street,
              "zip": client.Zip
            },
            "shipping_address": {
              "country": client.Country,
              "state": client.CountryState,
              "city": client.City,
              "street": client.Street,
              "zip": client.Zip
            },
            "custom_fields": custom_fields,
            "is_portal_enabled": true,
            "ach_supported": true
          }
        }
      
        const create_client = await zoho.createCustomerWithoutSubscription(domain_url, organizationid, oauthtoken, zoho_body);

        //Extraer id de cliente de Zoho Subscriptions
        const zoho_client_id = create_client.customer.customer_id;

        //Actualizar registro en base de datos con ID cliente de Zoho
        if(create_client) {
          const update_client = await uisp.updateSingleCustomer(client.uispdbID, zoho_client_id);
          if(update_client) {
            console.log("CLIENTE_ACTUALIZADO ===>", client.uispdbID, zoho_client_id);
          }

          if(client.AccountCredit > 0) {
            let client_details = {
              "customer_id": zoho_client_id,
              "amount": client.AccountCredit,
              "payment_mode": "Saldo UISP",
              "description":"Saldo proveniente de migración UISP"
            }
  
            await zoho.addCreditViaPayment(domain_url, organizationid, oauthtoken, client_details)
          }

          //Actualización de campo de suscripciones
          for(service of client_services) {
            if (code_array_ns.includes(Number(service)) === true) {
              if(subscriptions_id.length === 0) {
                subscriptions_id = 'no_creada';
              }
              else {
                subscriptions_id = subscriptions_id + "," + 'no_creada';
              }
            }
          }
          await uisp.updateClientSubscriptions(client.uispdbID, subscriptions_id);
        }
      }
      else {
        //Se crea cliente y subscripción en la primera iteración y luego se añaden las demás subscripciones
        var customer_created = false;

        for(let i = 0; i < client_subscriptions.length; i++) {
          () => console.log("customer_created", customer_created)

          if(client_subscriptions[i] === "2" || code_array_ns.includes(Number(client_services[i])) === true) {
            if(subscriptions_id.length === 0) {
              subscriptions_id = 'no_creada';
            }
            else {
              subscriptions_id = subscriptions_id + "," + 'no_creada';
            }
            await uisp.updateClientSubscriptions(client.uispdbID, subscriptions_id);
          }
         
          if(customer_created === false && (client_subscriptions[i] === "1" || client_subscriptions[i] === "3") && code_array_ns.includes(Number(client_services[i])) === false) {
            console.log(customer_created)
            customer_created = !customer_created;
            console.log(customer_created)

            //console.log("PRIMER PROCESO CLIENTE + SUBSCRIPCION")
            //Análisis para campos personalizados para el cliente
            if(client.CustomerIDUISP !== null && client.CustomerIDUISP !== "") {
              let jsn = {
                "label": "ID Cliente UISP",
                "value": client.CustomerIDUISP
              }
              custom_fields_customer.push(jsn);
            }

            if(client.RIF !== null && client.RIF !== "") {
              let jsn = {
                "label": "Cedula o RIF",
                "value": client.RIF
              }
              custom_fields_customer.push(jsn);
            }

            //Análisis para campos personalizados para la subscripción
            if(client.Latitude !== null && client.Latitude !== "") {
              let jsn = {
                "label": "Latitud",
                "value": client.Latitude
              }
              custom_fields_subscription.push(jsn);
            }

            if(client.Longitude !== null && client.Longitude !== "") {
              let jsn = {
                "label": "Longitud",
                "value": client.Longitude
              }
              custom_fields_subscription.push(jsn);
            }

            if(client.GoogleMapsURL !== null && client.GoogleMapsURL !== "") {
              let jsn = {
                "label": "Enlace Google Maps",
                "value": client.GoogleMapsURL
              }
              custom_fields_subscription.push(jsn);
            }

            if(client.OrganizationName !== null && client.OrganizationName !== "") {
              let jsn = {
                "label": "Nodo",
                "value": client.OrganizationName
              }
              custom_fields_subscription.push(jsn);
            }

            if(client_services[i] !== null && client_services[i] !== "") {
              let jsn = {
                "label": "ID Servicio UISP",
                "value": client_services[i]
              }
              custom_fields_subscription.push(jsn);
            }

            if(client_activeFrom[i] !== null && client_activeFrom[i] !== "") {
              let jsn = {
                "label": "Creada en UISP",
                "value": client_activeFrom[i]
              }
              custom_fields_subscription.push(jsn);
            }

            //Configuración de addon si es el caso
            let addons = [];
            console.log("SERVICES", services_description);

            for(let [index, addon] of client_services.entries()) {
              if(addons.length === 0) {
                if (['178', '179', '216', '277', '278'].includes(addon.trim()) === true) {
                  let position = 0;
                  if(index === 0) {
                    position = 1;
                  }
                  else {
                    position = 0;
                  }
                  console.log("index", index);
                  console.log("position", position);
                  console.log("NOMBRE SERVICIO", services_description[position]);
  
                  let jsn = {};
                  if(services_description[position].includes("WIRELESS") === true) {
                    jsn = {
                      "addon_code": "ippw",
                      "quantity": 1
                    }
                    addons.push(jsn);
                  } 
                  else if(services_description[position].includes("RESIDENCIAL") === true) {
                    jsn = {
                      "addon_code": "ippr",
                      "quantity": 1
                    }
                    addons.push(jsn);
                  } 
                  else if(services_description[position].includes("CORP") === true) {
                    jsn = {
                      "addon_code": "ippc",
                      "quantity": 1
                    }
                    addons.push(jsn);
                  } 
                  else if(services_description[position].includes("PYME") === true) {
                    jsn = {
                      "addon_code": "ippp",
                      "quantity": 1
                    }
                    addons.push(jsn);
                  }
                }
              }
            }
            console.log("addon", addons[0]);

            //JSON de configuración para Zoho Subscriptions ==> Creación de cliente más subscripción
            let zoho_body = {};

            if(client.ClientType === 1) {
              zoho_body =  {
                "customer": {
                  "display_name": client.DisplayName,
                  "first_name": client.FirstName,
                  "last_name": client.LastName,
                  "customer_sub_type": (client.ClientType === 1) ? "individual" : "business",
                  "email": client.Email,
                  //"email": `testmailbox2022+cliente${client.CustomerIDUISP}@gmail.com`,
                  "mobile": client.Phone,
                  "billing_address": {
                    "country": client.Country,
                    "state": client.CountryState,
                    "city": client.City,
                    "street": client.Street,
                    "zip": client.Zip
                  },
                  "shipping_address": {
                    "country": client.Country,
                    "state": client.CountryState,
                    "city": client.City,
                    "street": client.Street,
                    "zip": client.Zip
                  },
                  "custom_fields": custom_fields_customer,
                  "is_portal_enabled": true,
                  "ach_supported": true
                },
                "plan": {
                  "plan_code": client_codes[i],
                  "quantity": "1",
                  "price": (client.organizationId === 12) ? 0 : (client_prices[i] * (1 - (subscription_discounts[i]/100))),
                  "exclude_setup_fee": true
                },
                "addons": addons,
                "custom_fields": custom_fields_subscription,
                "starts_at": "2022-04-01",
                "allow_partial_payments": true,
                "auto_collect": "false"
              };
            }
            else {
              zoho_body =  {
                "customer": {
                  "display_name": client.DisplayName,
                  "customer_sub_type": (client.ClientType === 1) ? "individual" : "business",
                  "email": client.Email,
                  //"email": `testmailbox2022+cliente${client.CustomerIDUISP}@gmail.com`,
                  "mobile": client.Phone,
                  "billing_address": {
                    "country": client.Country,
                    "state": client.CountryState,
                    "city": client.City,
                    "street": client.Street,
                    "zip": client.Zip
                  },
                  "shipping_address": {
                    "country": client.Country,
                    "state": client.CountryState,
                    "city": client.City,
                    "street": client.Street,
                    "zip": client.Zip
                  },
                  "custom_fields": custom_fields_customer,
                  "is_portal_enabled": true,
                  "ach_supported": true
                },
                "plan": {
                  "plan_code": client_codes[i],
                  "quantity": "1",
                  "price": (client.organizationId === 12) ? 0 : (client_prices[i] * (1 - (subscription_discounts[i]/100))),
                  "exclude_setup_fee": true
                },
                "addons": addons,
                "custom_fields": custom_fields_subscription,
                "starts_at": "2022-04-01",
                "allow_partial_payments": true,
                "auto_collect": "false"
              };

            }
            
            //Crear cliente con su respectiva subscripción en Zoho Subscriptions
            const create_client = await zoho.createSubscriptionCustomer(domain_url, organizationid, oauthtoken, zoho_body);

            //console.log("CLIENTE_CREADO ===>", create_client);

            //Extraer id de subscripción de cliente de Zoho Subscriptions
            zoho_client_id = create_client.subscription.customer.customer_id;

            //Id de suscripción
            if(subscriptions_id.length === 0) {
              subscriptions_id = create_client.subscription.subscription_id;
            }
            else {
              subscriptions_id = subscriptions_id + "," + create_client.subscription.subscription_id;
            }
            
            //Actualizar registro en base de datos con ID cliente de Zoho
            if(create_client) {
              const update_client = await uisp.updateCustomer(client.uispdbID, zoho_client_id);
              
              await uisp.updateClientSubscriptions(client.uispdbID, subscriptions_id);
              if(update_client) {
                console.log("CLIENTE_ACTUALIZADO ===>", client.uispdbID, zoho_client_id);
              }

              if(client.AccountCredit > 0) {
                console.log("revisando credito")
                let client_details = {
                  "customer_id": zoho_client_id,
                  "amount": client.AccountCredit,
                  "payment_mode": "Saldo UISP",
                  "description":"Saldo proveniente de migración UISP"
                }
      
                await zoho.addCreditViaPayment(domain_url, organizationid, oauthtoken, client_details);
              }

              if(client.AccountOutstanding > 0) {
                console.log("revisando deuda")
                /*
                let zoho_charge_body = {
                  "amount": client.AccountOutstanding,
                  "description":"Saldo pendiente previo al 28 de febrero"
                }
                await zoho.addChargeToSubscription(domain_url, organizationid, oauthtoken, zoho_subscription_id, zoho_charge_body);
                */
              }
            }
          }
          else if (customer_created === true && (client_subscriptions[i] === "1" || client_subscriptions[i] === "3") && code_array_ns.includes(Number(client_services[i])) === false) {
            //Análisis para campos personalizados para la subscripción
            //console.log("ENTRE PARA LA OTRA SUBS");
            custom_fields_subscription = [];
            
            let second_timer = setInterval(async function() { 
              if(client.Latitude !== null && client.Latitude !== "") {
                let jsn = {
                  "label": "Latitud",
                  "value": client.Latitude
                }
                custom_fields_subscription.push(jsn);
              }
  
              if(client.Longitude !== null && client.Longitude !== "") {
                let jsn = {
                  "label": "Longitud",
                  "value": client.Longitude
                }
                custom_fields_subscription.push(jsn);
              }
  
              if(client.GoogleMapsURL !== null && client.GoogleMapsURL !== "") {
                let jsn = {
                  "label": "Enlace Google Maps",
                  "value": client.GoogleMapsURL
                }
                custom_fields_subscription.push(jsn);
              }
  
              if(client.OrganizationName !== null && client.OrganizationName !== "") {
                let jsn = {
                  "label": "Nodo",
                  "value": client.OrganizationName
                }
                custom_fields_subscription.push(jsn);
              }
  
              if(client_services[i] !== null && client_services[i] !== "") {
                let jsn = {
                  "label": "ID Servicio UISP",
                  "value": client_services[i]
                }
                custom_fields_subscription.push(jsn);
              }
  
              if(client_activeFrom[i] !== null && client_activeFrom[i] !== "") {
                let jsn = {
                  "label": "Creada en UISP",
                  "value": client_activeFrom[i]
                }
                custom_fields_subscription.push(jsn);
              }
  
              //JSON de configuración para Zoho Subscriptions ==> Añadir subscripción al cliente ya creado
              let zoho_body =  {
                "customer_id": zoho_client_id,
                "plan": {
                  "plan_code": client_codes[i],
                  "quantity": "1",
                  "price": (client.organizationId === 12) ? 0 : (client_prices[i] * (1 - (subscription_discounts[i]/100))),
                  "exclude_setup_fee": true
                },
                "custom_fields": custom_fields_subscription,
                "starts_at": "2022-04-01",
                "allow_partial_payments": true,
                "auto_collect": "false"
              };
  
              //Añadir subscripción al cliente creado en Zoho Subscriptions
              const create_client = await zoho.addNewSubscription(domain_url, organizationid, oauthtoken, zoho_body);
              console.log("SUBSCRIPCION_ANADIDA ===>", create_client.subscription.subscription_id);
              
              if(subscriptions_id.length === 0) {
                subscriptions_id = create_client.subscription.subscription_id;
              }
              else {
                subscriptions_id = subscriptions_id + "," + create_client.subscription.subscription_id;
              }
              
              await uisp.updateClientSubscriptions(client.uispdbID, subscriptions_id);
              
              /*
                Extraer id de subscripción de cliente de Zoho Subscriptions
                const zoho_client_id = create_client.subscription.customer.customer_id;
                Actualizar registro en base de datos con ID cliente de Zoho
                if(create_client) {
                  const update_client = await uisp.updateCustomer(client.uispdbID, zoho_client_id);
                  if(update_client) {
                    console.log("CLIENTE_ACTUALIZADO ===>", client.uispdbID, zoho_client_id);
                  }
                }
              */
              clearInterval(second_timer);
            }, 2000)
          }
        }
      }
      
    
    }
    
    
  }
}

module.exports.cleanData = async () => {

  //Data de clientes creados en Zoho para limpiar
  const uisp_clients = await uisp.getCreatedClients()
	.then(data => {
    return data;
	})
	.catch(err => {
    console.log("ERROR_GETTING_ALL_DATA ===>", err);
		logger.log('error',`File: uisp_hanlders.js - Function Name: migrateData - Error ${err}`);
		//res.send( resForm.error(response.responseFromServer().error.EMAIL_USER_NOT_REGISTERED) );
	})

  console.log("CANTIDAD_CLIENTES_LIMPIAR ===>", uisp_clients.length);

  //Lógica de borrado de clientes
  client_counter = 0;
  let timer = setInterval(function(){ 
    eraseClientFromZoho(uisp_clients[client_counter]);
    client_counter +=1;
    if(client_counter >= uisp_clients.length) {
      console.log("BORRADO FINALIZADO");
      clearInterval(timer);
    }
  }, 10000);

  async function eraseClientFromZoho(client) {

    /*** PASO 1: Token para acceder a Zoho ***/
    const billing_config = await configuration.retrieveBillingConfig('63754c44');

    const {billing_system_id: billing_system, integration_config: configString} = billing_config;
    const configJSON = JSON.parse(configString);

    const { 
      organizationid: organizationid, 
      domain_url: domain_url, 
      client_id: client_id,
      client_secret: client_secret,
      redirect_url: redirect_url,
      refresh_token: refresh_token, 
      created_at: created_at 
    } = configJSON;

    let oauthtoken = "";
   
    //Calculate access token remaining validity time
    const elapsed_time = Date.now() - created_at;
    const remaining_time = 3600000 - elapsed_time;
    const elapsed_min = elapsed_time / 60000;
    const remaining_min = remaining_time / 60000;
    
    if(remaining_min <= 5) {
      //Request new access token
      const token_data = await zoho.generateAccessToken(client_id, client_secret, refresh_token);
      
      if(token_data) {
        //Available data after request ===> access_token, expires_in, api_domain, token_type 
        const {access_token: access_token} = token_data;
        const new_created_at = Date.now().toString();
        //Insert new config to database
        const config = {
          "organizationid"    : organizationid,
          "oauthtoken"        : access_token,
          "domain_url"        : domain_url,
          "client_id"         : client_id,
          "client_secret"     : client_secret,
          "redirect_url"      : redirect_url,
          "refresh_token"     : refresh_token,
          "created_at"        : new_created_at
        }
        
        const zoho_config = JSON.stringify(config);
        
        const data = await configuration.insertZohoNewConfig(zoho_config, '63754c44');

        if(data) {
          //Set new access_token for current API call
          oauthtoken = access_token;
        }
      }
    }
    else {
      oauthtoken = configJSON.oauthtoken;
    }
    /*** Token para acceder a zoho ***/

    //Solicitud de data de transacciones
    const {transactions} = await zoho.getTransactions(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
    
    //Solicitud de data de suscripciones
    const {subscriptions} = await zoho.getAllSubscriptions(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);

    //Borrado ordenado de pagos, notas y facturas
    transaction_counter = 0;
    subscriptions_counter = 0;
    let timer = setInterval(function(){ 
      if(transaction_counter < transactions.length) {
        console.log("TRANSACCION")
        deleteTransaction(transactions[transaction_counter]);
        transaction_counter +=1;
      }
      else if(transaction_counter === transactions.length) {
        if (subscriptions_counter < subscriptions.length) {
          console.log("SUSCRIPCION")
          deleteSubscription(subscriptions[subscriptions_counter]);
          subscriptions_counter +=1;
        }
        else {
          console.log("CLIENTE")
          deleteCustomer();
          clearInterval(timer);
        }
      }
    }, 2000)

    async function deleteTransaction(transaction) {
      if(transaction.type ==='payment') {
        await zoho.deletePayment(domain_url, organizationid, oauthtoken, transaction.transaction_id);
      }
      else if(transaction.type ==='credit') {
        await zoho.deleteCreditNote(domain_url, organizationid, oauthtoken, transaction.transaction_id);
        
      }
      else if(transaction.type ==='invoice') {
        await zoho.deleteInvoice(domain_url, organizationid, oauthtoken, transaction.transaction_id);
      }
    }

    async function deleteSubscription(subscription) {
      await zoho.deleteSubscription(domain_url, organizationid, oauthtoken, subscription.subscription_id);
    }    

    async function deleteCustomer() {
      const delete_customer = await zoho.deleteCustomer(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
      if (delete_customer) {
        await uisp.resetCustomer(client.uispdbID);
        console.log("CLIENTE_BORRADO_uispdbID ===>", client.uispdbID, client.DisplayName);
        console.log("ZOHO_DATA ===>", delete_customer);
      }
    }
  }
}

module.exports.addCharges = async () => {
  //Data de clientes creados en Zoho para añadir cargo de deuda pendiente a una suscripción
  const uisp_clients = await uisp.getClientsWithDebt()
	.then(data => {
    return data;
	})
	.catch(err => {
    console.log("ERROR_GETTING_DATA ===>", err);
		logger.log('error',`File: uisp_hanlders.js - Function Name: addCharges - Error ${err}`);
		//res.send( resForm.error(response.responseFromServer().error.EMAIL_USER_NOT_REGISTERED) );
	})

  console.log("CANTIDAD_CLIENTES_ACTUALIZAR ===>", uisp_clients.length);

  //Lógica para poder realizar el cargo de la deuda a la suscripción
  client_counter = 0;
  let timer = setInterval(function(){ 
    updateClientFromZoho(uisp_clients[client_counter]);
    client_counter +=1;
    if(client_counter >= uisp_clients.length) {
      console.log("ACTUALIZACION DE CARGOS FINALIZADA");
      clearInterval(timer);
    }
  }, 15000);

  async function updateClientFromZoho(client) {

    /*** PASO 1: Token para acceder a Zoho ***/
    const billing_config = await configuration.retrieveBillingConfig('63754c44');

    const {billing_system_id: billing_system, integration_config: configString} = billing_config;
    const configJSON = JSON.parse(configString);

    const { 
      organizationid: organizationid, 
      domain_url: domain_url, 
      client_id: client_id,
      client_secret: client_secret,
      redirect_url: redirect_url,
      refresh_token: refresh_token, 
      created_at: created_at 
    } = configJSON;

    let oauthtoken = "";
   
    //Calculate access token remaining validity time
    const elapsed_time = Date.now() - created_at;
    const remaining_time = 3600000 - elapsed_time;
    const elapsed_min = elapsed_time / 60000;
    const remaining_min = remaining_time / 60000;
    
    if(remaining_min <= 5) {
      //Request new access token
      const token_data = await zoho.generateAccessToken(client_id, client_secret, refresh_token);
      
      if(token_data) {
        //Available data after request ===> access_token, expires_in, api_domain, token_type 
        const {access_token: access_token} = token_data;
        const new_created_at = Date.now().toString();
        //Insert new config to database
        const config = {
          "organizationid"    : organizationid,
          "oauthtoken"        : access_token,
          "domain_url"        : domain_url,
          "client_id"         : client_id,
          "client_secret"     : client_secret,
          "redirect_url"      : redirect_url,
          "refresh_token"     : refresh_token,
          "created_at"        : new_created_at
        }
        
        const zoho_config = JSON.stringify(config);
        
        const data = await configuration.insertZohoNewConfig(zoho_config, '63754c44');

        if(data) {
          //Set new access_token for current API call
          oauthtoken = access_token;
        }
      }
    }
    else {
      oauthtoken = configJSON.oauthtoken;
    }
    /*** Token para acceder a zoho ***/

    //Suscripciones del cliente
    const client_subscriptions = await zoho.getAllSubscriptions(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
  
    //Extracción del id de la primera suscripción recibida como resultado
    let subscription_id = client_subscriptions.subscriptions[0].subscription_id;

    //Añadir el cargo a la suscripción del cliente con deuda pendiete
    let zoho_charge_body = {
      "amount": client.AccountOutstanding,
      "description":"Saldo pendiente UISP"
    }

    const add_charge = await zoho.addChargeToSubscription(domain_url, organizationid, oauthtoken, subscription_id, zoho_charge_body);
    console.log("DEUDA - CustomerIDUISP:", client.CustomerIDUISP);
    if(add_charge) {
      await uisp.updateClientDebt(client.CustomerIDUISP);
      console.log("DEUDA ANADIDA - CustomerIDUISP:", client.CustomerIDUISP);
    }
  }
}

module.exports.updateClients = async() => {
  //Obtener la data de clientes que requieren la actualización de id de suscripciones de zoho
  const uisp_clients = await uisp.getClientsForUpdate()
	.then(data => {
    return data;
	})
	.catch(err => {
    console.log("ERROR_GETTING_CLIENTS_FOR_UPDATE ===>", err);
		logger.log('error',`File: uisp_handlers.js - Function Name: updateClients - Error ${err}`);
	})

  console.log("LISTA_CLIENTES_ACTUALIZAR ===>", uisp_clients.length);

  //Procesamiento de cada cliente
  for(client of uisp_clients) {
    /*** Token para acceder a Zoho ***/
    const billing_config = await configuration.retrieveBillingConfig('63754c44');

    const {billing_system_id: billing_system, integration_config: configString} = billing_config;
    const configJSON = JSON.parse(configString);

    const { 
      organizationid: organizationid, 
      domain_url: domain_url, 
      client_id: client_id,
      client_secret: client_secret,
      redirect_url: redirect_url,
      refresh_token: refresh_token, 
      created_at: created_at
    } = configJSON;

    let oauthtoken = "";
   
    //Calculate access token remaining validity time
    const elapsed_time = Date.now() - created_at;
    const remaining_time = 3600000 - elapsed_time;
    const elapsed_min = elapsed_time / 60000;
    const remaining_min = remaining_time / 60000;
    
    if(remaining_min <= 5) {
      const token_data = await zoho.generateAccessToken(client_id, client_secret, refresh_token);
      
      if(token_data) {
        const {access_token: access_token} = token_data;
        const new_created_at = Date.now().toString();

        const config = {
          "organizationid"    : organizationid,
          "oauthtoken"        : access_token,
          "domain_url"        : domain_url,
          "client_id"         : client_id,
          "client_secret"     : client_secret,
          "redirect_url"      : redirect_url,
          "refresh_token"     : refresh_token,
          "created_at"        : new_created_at
        }
        
        const zoho_config = JSON.stringify(config);
        
        const data = await configuration.insertZohoNewConfig(zoho_config, '63754c44');

        if(data) {
          oauthtoken = access_token;
        }
      }
    }
    else {
      oauthtoken = configJSON.oauthtoken;
    }
    /*** Token para acceder a zoho ***/
    
    const client_subscriptions = await zoho.getAllSubscriptions(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
    const array_subscriptions = client_subscriptions.subscriptions;

    let subscriptions_string = "";
    for(subscription of array_subscriptions) {
      if(subscriptions_string.length === 0) {
        subscriptions_string = subscription.subscription_id;
      }
      else {
        subscriptions_string = subscriptions_string + "," + subscription.subscription_id;
      }
    }

    if(subscriptions_string.length === 0) {
      subscriptions_string = null;
    }

    await uisp.updateSubscriptions(subscriptions_string, client.CustomerIDZoho);
    console.log("CLIENTE ===>", client.CustomerIDZoho);
  }

}

module.exports.updateBillingDateMarch = async() => {
  //Clientes que requieren actualización de fecha de facturación
  let uisp_clients = await uisp.getClientsToUpdateNextBillingAt()
	.then(data => {
    return data;
	})
	.catch(err => {
    console.log("ERROR_GET_CLIENTS_TO_UPDATE ===>", err);
		logger.log('error',`File: uisp_handlers.js - Function Name: updateBillingDateMarch - Error ${err}`);
	})

  //Cantidad de clientes recibidos de la consulta a base de datos
  
  uisp_clients = [
    {
      "DisplayName": "Roberto AR Gutierrez",
      "CustomerIDUISP": 35000, 
      "CustomerIDZoho": "2965133000000736004",
      "ActiveFrom": "2022-03-25"
    }
  ]
  console.log("CLIENTES_ACTUALIZAR ===>", uisp_clients.length);
  console.log("CLIENTES_ACTUALIZAR ===>", uisp_clients[0]);
  
  //Recibido por base de datos uispdbID, DisplayName, CustomerIDUISP, CustomerIDZoho, ActiveFrom
  //let march_nine = new Date('2022-03-09').valueOf();

  //Lógica para actualización de clientes
  let client_counter = 0;
  let timer = setInterval(function(){ 
    updateClientBilling(uisp_clients[client_counter]);
    client_counter +=1;
    if(client_counter >= uisp_clients.length) {
      console.log("ACTUALIZACION FINALIZADA");
      clearInterval(timer);
    }
  }, 11000);

  async function updateClientBilling(client) {
    const {domain_url, organizationid, oauthtoken} = await zoho_access_token('');
    
    //Solicitud de todas las suscripciones del cliente
    const client_subscriptions = await zoho.getAllSubscriptions(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
    
    //Identificación de cuales son las suscripciones a modificar
    const subscriptions_data = await process_client_subscriptions(client_subscriptions.subscriptions);
    
    //Solicitud de todas las facturas del cliente
    const {invoices: client_invoices} = await zoho.get_all_invoices(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);

    //Análisis de correspondencia y actualización
    await process_client(domain_url, organizationid, oauthtoken, subscriptions_data, client_invoices, client);

  }

}

module.exports.processDates = async() => {
  //Clientes que requieren actualización de fecha de facturación
  let uisp_clients = await uisp.getClientsForDates()
	.then(data => {
    return data;
	})
	.catch(err => {
    console.log("ERROR_PROCESS_DATES ===>", err);
		logger.log('error',`File: uisp_handlers.js - Function Name: processDates - Error ${err}`);
	})

  console.log("CLIENTES_ACTUALIZAR ===>", uisp_clients.length);

  //Procesamiento de fechas para insertar en base de datos de vuelta

  for(client of uisp_clients) {
    let string_date = "";
    const array_invoices = JSON.parse(client.InvoicesDetailPrevInfo);

    for(invoice of array_invoices) {
      if(invoice.invoice.status === "paid" || invoice.invoice.status === "paid") {
        if(invoice.invoice.payments.length > 0) {
          string_date = (string_date.length === 0) ? invoice.invoice.payments[0].date : string_date + "," + invoice.invoice.payments[0].date;
        }
      }
    }

    string_date = (string_date.length === 0) ? null : string_date;

    await uisp.insertDate(client.DisplayName, string_date);

  }
  
 

}

module.exports.updateMarchClients = async() => {
  //Clientes filtrados de base de datos entre el 10 de Marzo en adelante
  let uisp_clients = await uisp.getMarchClients()
	.then(data => {
    return data;
	})
	.catch(err => {
    console.log("ERROR_GET_CLIENTS_TO_UPDATE ===>", err);
		logger.log('error',`File: uisp_handlers.js - Function Name: updateMarchClients - Error ${err}`);
	})

  console.log("CANTIDAD_CLIENTES ===>", uisp_clients.length);
  //Lógica para actualización de clientes
  let client_counter = 0;
  let timer = setInterval(function(){ 
    updateMarchClientFunction(uisp_clients[client_counter]);
    client_counter +=1;
    if(client_counter >= uisp_clients.length) {
      console.log("ACTUALIZACION FINALIZADA");
      clearInterval(timer);
    }
  }, 15000);

  async function updateMarchClientFunction(client) {
    const {domain_url, organizationid, oauthtoken} = await zoho_access_token('63754c44');

    //Solicitud de todas las suscripciones del cliente
    const client_subscriptions = await zoho.getAllSubscriptions(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
  
    //Identificación de cuales son las suscripciones a modificar
    const subscriptions_to_update = await analyze_subscriptions_data(client_subscriptions.subscriptions);
    
    //Solicitud de todas las facturas del cliente
    const client_invoices = await zoho.get_all_invoices(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
    
    //Variables para la base de datos
    const subscriptions_prev_info = JSON.stringify(client_subscriptions);
    const invoices_prev_info = JSON.stringify(client_invoices);
    
    //Análisis de correspondencia y actualización
    await process_march_client(domain_url, organizationid, oauthtoken, subscriptions_to_update, client_invoices.invoices, client, subscriptions_prev_info, invoices_prev_info);

  }

}

module.exports.registerPaymentLogs = async() => {
  //Clientes con información de pagos
  let uisp_clients = await uisp.getPaymentClients()
	.then(data => {
    return data;
	})
	.catch(err => {
    console.log("ERROR_PAYMENT_LOGS ===>", err);
		logger.log('error',`File: uisp_handlers.js - Function Name: registerPaymentLogs - Error ${err}`);
	})

  console.log("CANTIDAD_CLIENTES ===>", uisp_clients.length);

  /*
    let client_counter = 0;
    let timer = setInterval(function(){ 
      analyzeClient(uisp_clients[client_counter]);
      client_counter +=1;
      if(client_counter >= uisp_clients.length) {
        console.log("ACTUALIZACION FINALIZADA");
        clearInterval(timer);
      }
    }, );
    async function analyzeClient(client) {
   
    }
  */

  //Procesamiento de la información para generar el reporte

  for(let [index, client] of uisp_clients.entries()) {
    //Arreglo de JSON de todas las facturas del clientes
    const invoices_logs = JSON.parse(client.InvoicesDetailPrevInfo);

    //Análisis de la información

    for(let [index, invoice] of invoices_logs.entries()) {
      //customer_name, date, invoice_number, reference_number, payment_mode, total, status

      let customer_name = invoice.invoice.customer_name;
      let date = (invoice.invoice.payments.length != 0) ? `'${invoice.invoice.payments[0].date}'` : null;
      let invoice_number = invoice.invoice.invoice_number;
      let reference_number = (invoice.invoice.payments.length != 0) ? `'${invoice.invoice.payments[0].reference_number}'` : null;
      let payment_mode = (invoice.invoice.payments.length != 0) ? `'${invoice.invoice.payments[0].payment_mode}'` : null;
      let total = invoice.invoice.total
      let status = invoice.invoice.status;

      await uisp.insertPaymentLog(customer_name, date, invoice_number, reference_number, payment_mode, total, status);
      
    }
    
  }

}

module.exports.editPendingClients = async() => {
  //Recuperar clientes a los cuales añadiremos suscripciones
  
  let uisp_clients = await uisp.obtainPendingClients()
	.then(data => {
    return data;
	})
	.catch(err => {
    console.log("ERROR_PENDING_SUBSCRIPTIONS ===>", err);
		logger.log('error',`File: uisp_handlers.js - Function Name: editPendingClients - Error ${err}`);
	})
  
  /*
  let uisp_clients = [
    {
      "CustomerIDZoho": "2965133000000736004"
    }
  ]
  */
  console.log("CANTIDAD_CLIENTES ===>", uisp_clients.length);

  //Lógica para actualización de clientes
  let client_counter = 0;
  let timer = setInterval(function(){ 
    editClient(uisp_clients[client_counter]);
    client_counter +=1;
    if(client_counter >= uisp_clients.length) {
      console.log("PROCESO FINALIZADO");
      clearInterval(timer);
    }
  }, 2000);

  async function editClient(client) {
    const {domain_url, organizationid, oauthtoken} = await zoho_access_token('63754c44');

    //Solicitud de todas las suscripciones del cliente
    const client_subscriptions = await zoho.getAllSubscriptions(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
  
    //Identificación de cuales son las suscripciones a modificar
    const subscriptions_to_update = await analyze_subscriptions_data_clients(client_subscriptions.subscriptions);
    
    //Solicitud de todas las facturas del cliente
    const client_invoices = await zoho.get_all_invoices(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
    
    //Variables para la base de datos
    const subscriptions_prev_info = JSON.stringify(client_subscriptions);
    const invoices_prev_info = JSON.stringify(client_invoices);
    
    //Análisis de correspondencia y actualización
    await process_pending_client(domain_url, organizationid, oauthtoken, subscriptions_to_update, client_invoices.invoices, client, subscriptions_prev_info, invoices_prev_info);

  }





}

module.exports.fixIVA = async() => {
  //Recuperar clientes a los cuales añadiremos suscripciones
  
  let uisp_clients = await uisp.obtainIVAClients()
	.then(data => {
    return data;
	})
	.catch(err => {
    console.log("ERROR_PENDING_SUBSCRIPTIONS ===>", err);
		logger.log('error',`File: uisp_handlers.js - Function Name: fixIVA - Error ${err}`);
	})
  
/*
  let uisp_clients = [
    {
      "CustomerIDZoho": "2965133000000736004"
    }
  ]
  */
  console.log("CANTIDAD_CLIENTES ===>", uisp_clients.length);

  //Lógica para actualización de clientes
  let client_counter = 0;
  let timer = setInterval(function(){ 
    editClient(uisp_clients[client_counter]);
    client_counter +=1;
    if(client_counter >= uisp_clients.length) {
      console.log("PROCESO FINALIZADO");
      clearInterval(timer);
    }
  }, 2000);

  async function editClient(client) {
    const {domain_url, organizationid, oauthtoken} = await zoho_access_token('63754c44');

    //Solicitud de todas las suscripciones del cliente
    const client_subscriptions = await zoho.getAllSubscriptions(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
  
    //Identificación de cuales son las suscripciones a modificar
    const subscriptions_to_update = await analyze_subscriptions_IVA_clients(client_subscriptions.subscriptions);
    
    //Solicitud de todas las facturas del cliente
    const client_invoices = await zoho.get_all_invoices(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
    
    //Variables para la base de datos
    const subscriptions_prev_info = JSON.stringify(client_subscriptions);
    const invoices_prev_info = JSON.stringify(client_invoices);
    
    //Análisis de correspondencia y actualización
    
    await process_IVA_client(domain_url, organizationid, oauthtoken, subscriptions_to_update, client_invoices.invoices, client, subscriptions_prev_info, invoices_prev_info);

  }



}

//Funciones para renovación suscripción
async function zoho_access_token(api_key) {
  const billing_config = await configuration.retrieveBillingConfig(api_key);
  
  const {billing_system_id: billing_system, integration_config: configString} = billing_config;
  
  const configJSON = JSON.parse(configString);

  const { 
    organizationid: organizationid, 
    domain_url: domain_url, 
    client_id: client_id,
    client_secret: client_secret,
    redirect_url: redirect_url,
    refresh_token: refresh_token, 
    created_at: created_at
  } = configJSON;

  let oauthtoken = "";

  //Calculate access token remaining validity time
  const elapsed_time = Date.now() - created_at;
  const remaining_time = 3600000 - elapsed_time;
  const elapsed_min = elapsed_time / 60000;
  const remaining_min = remaining_time / 60000;

  if(remaining_min <= 5) {
    //Request new access token
    const token_data = await zoho.generateAccessToken(client_id, client_secret, refresh_token);
    
    if(token_data) {
      //Available data after request ===> access_token, expires_in, api_domain, token_type 
      const {access_token: access_token} = token_data;

      const new_created_at = Date.now().toString();
      //Insert new config to database
      const config = {
        "organizationid"    : organizationid,
        "oauthtoken"        : access_token,
        "domain_url"        : domain_url,
        "client_id"         : client_id,
        "client_secret"     : client_secret,
        "redirect_url"      : redirect_url,
        "refresh_token"     : refresh_token,
        "created_at"        : new_created_at
      }
      
      const zoho_config = JSON.stringify(config);

      const data = await configuration.insertZohoNewConfig(zoho_config, api_key);

      if(data) {

        //Set new access_token for current API call
        oauthtoken = access_token;
      }
    }
  }
  else {
    oauthtoken = configJSON.oauthtoken;
  }
  
  return {
    "domain_url": domain_url,
    "organizationid": organizationid,
    "oauthtoken": oauthtoken
  }
}

async function process_client_subscriptions(subscriptions) {
  let subscriptions_array = [];

  for(let subscription of subscriptions) {
    let march_nine = new Date('2022-03-09').valueOf();
    let subscription_date = new Date(subscription.cf_created_date_uisp_unformatted).valueOf();
    let difference_between_dates = subscription_date - march_nine;

    if(difference_between_dates >= 0) {
      //let renewal_date = `2022-${Number(subscription.cf_created_date_uisp_unformatted.split("-")[1]) + 1}-${cf_created_date_uisp_unformatted.split("-")[2]}`;
      let renewal_date = `2022-04-${subscription.cf_created_date_uisp_unformatted.split("-")[2]}`;

      let jsn = {
        "id": subscription.subscription_id,
        "body": {
          "renewal_at": renewal_date
        }
      }

      subscriptions_array.push(jsn);
    }
    
  }
  return subscriptions_array;
}

async function process_client(domain_url, organizationid, oauthtoken, subscriptions, invoices, client) {
  for(let i in subscriptions) {
    let id = subscriptions[i].id;
    
    for(let p in invoices) {
      const invoice_detail = await zoho.get_invoice_detail(domain_url, organizationid, oauthtoken, invoices[p].invoice_id);

      if(invoice_detail.invoice.subscriptions[0].subscription_id === id) {
        let paymentID = invoice_detail.invoice.payments[0].payment_id;
        let invoiceID = invoice_detail.invoice.invoice_id;
        
        await zoho.deletePayment(domain_url, organizationid, oauthtoken, paymentID);
        await zoho.deleteInvoice(domain_url, organizationid, oauthtoken, invoiceID);

        if(invoice_detail.invoice.status === "paid" || invoice_detail.invoice.status === "partially_paid") {
          let client_details = {
            "customer_id": client.CustomerIDZoho,
            "amount": invoice_detail.invoice.payment_made,
            "payment_mode": "Saldo a favor",
            "description":"Actualización de fecha de la suscripción"
          }

          await zoho.addCreditViaPayment(domain_url, organizationid, oauthtoken, client_details);
          
        }
      }
    }
  }

  for(subscription of subscriptions) {
    await zoho.updateNextBillingDate(domain_url, organizationid, oauthtoken, subscription.id, subscription.body);
  }

  await uisp.updateBillingDate(client.uispdbID);
}

//Functiones para corregir todos los clientes de Marzo
async function analyze_subscriptions_data(subscriptions) {
  let subscriptions_array = [];

  for(let subscription of subscriptions) {
    let march_nine = new Date('2022-03-09').valueOf();
    let subscription_date = new Date(subscription.cf_created_date_uisp_unformatted).valueOf();
    let difference_between_dates = subscription_date - march_nine;

    if(difference_between_dates >= 0) {

      let jsn = {
        "id": subscription.subscription_id,
        "plan_code": subscription.plan_code,
        "price_sub_total": subscription.sub_total,
        "custom_fields": subscription.custom_fields,
        "starts_at": subscription.cf_created_date_uisp_unformatted
      }

      subscriptions_array.push(jsn);
    }
    
  }
  return subscriptions_array;
}

async function process_march_client(domain_url, organizationid, oauthtoken, subscriptions, invoices, client, subscriptions_prev_info, invoices_prev_info) {
  //Análisis suscripciones para limpieza y cargo de créditos
  let invoices_detail_prev_info = [];
  let has_credit = 0;

  for(let subscription of subscriptions) {
    let id = subscription.id;
    
    for(invoice of invoices) {
      const invoice_detail = await zoho.get_invoice_detail(domain_url, organizationid, oauthtoken, invoice.invoice_id);
      invoices_detail_prev_info.push(invoice_detail);

      if(invoice_detail.invoice.subscriptions[0].subscription_id === id) {

        if(invoice_detail.invoice.payments.length > 0) {
          let paymentID = invoice_detail.invoice.payments[0].payment_id;
          await zoho.deletePayment(domain_url, organizationid, oauthtoken, paymentID);

          let invoiceID = invoice_detail.invoice.invoice_id;
          await zoho.deleteInvoice(domain_url, organizationid, oauthtoken, invoiceID);
        }
        else {
          let invoiceID = invoice_detail.invoice.invoice_id;
          await zoho.deleteInvoice(domain_url, organizationid, oauthtoken, invoiceID);
        }


        if(invoice_detail.invoice.status === "paid" || invoice_detail.invoice.status === "partially_paid") {
          has_credit = 1;

          let client_details = {
            "customer_id": client.CustomerIDZoho,
            "amount": invoice_detail.invoice.payment_made,
            "payment_mode": "Saldo a favor",
            "description":"Actualización de fecha de la suscripción"
          }

          await zoho.addCreditViaPayment(domain_url, organizationid, oauthtoken, client_details);
          
        }
      }
    }
  }

  //Eliminar las suscripciones correspondientes
  for(subscription of subscriptions) {
    await zoho.cancel_subscription(domain_url, organizationid, oauthtoken, subscription.id);
  }

  //Creación de las suscripciones que se eliminaron con la fecha corregida
  for(subscription of subscriptions) {
    const custom_fields = await get_subscription_cf(subscription);
    const zoho_body = await get_zoho_body_add_subscription(client, subscription, custom_fields);
    await zoho.addNewSubscription(domain_url, organizationid, oauthtoken, zoho_body);
  }
  
  //Finalmente actualizar información en base de datos
  const inv_details_prev_info = JSON.stringify(invoices_detail_prev_info);

  await uisp.updateMarchClientUISP(client.uispdbID, subscriptions_prev_info, invoices_prev_info, inv_details_prev_info, has_credit, 1);
  console.log("CLIENTE_ACTUALIZADO_uispdbID ===>", client.uispdbID);
}

async function get_subscription_cf(subscription) {
  let custom_fields = [];

  const custom_fields_subscription = subscription.custom_fields;

  for(custom_field of custom_fields_subscription) {
    let jsn = {
      "label": custom_field.label,
      "value": custom_field.value
    }
    custom_fields.push(jsn);
  }

  return custom_fields;
}

async function get_zoho_body_add_subscription(client, subscription, custom_fields) {
  const zoho_body = {
    "customer_id": client.CustomerIDZoho,
    "plan": {
        "plan_code": subscription.plan_code,
        "price": subscription.price_sub_total,
        "quantity": "1",
        "exclude_setup_fee": true
    },
    "custom_fields": custom_fields,
    "create_backdated_invoice": true,
    "starts_at": subscription.starts_at,
    "allow_partial_payments": true,
    "auto_collect": "false"
  }

  return zoho_body;
}

//Funciones para corregir personas con planes erróneos de Full Data Los Arcos
//Se reutiliza funciones de get_subscription_cf y get_zoho_body_add_subscription
async function analyze_subscriptions_data_clients(subscriptions) {
  let subscriptions_array = [];

  for(let subscription of subscriptions) {
    let jsn = {
      "id": subscription.subscription_id,
      "plan_code": "FRMLITE",
      "price_sub_total": subscription.sub_total,
      "custom_fields": subscription.custom_fields,
      "starts_at": subscription.activated_at
    }
    subscriptions_array.push(jsn);
  }
  return subscriptions_array;
}

async function process_pending_client(domain_url, organizationid, oauthtoken, subscriptions, invoices, client, subscriptions_prev_info, invoices_prev_info) {
  //Análisis suscripciones para limpieza y cargo de créditos
  let invoices_detail_prev_info = [];
  let payments_detail_prev_info = [];
  let has_credit = 0;

  for(let subscription of subscriptions) {
    let id = subscription.id;
    
    for(invoice of invoices) {
      const invoice_detail = await zoho.get_invoice_detail(domain_url, organizationid, oauthtoken, invoice.invoice_id);
      invoices_detail_prev_info.push(invoice_detail);

      if(invoice_detail.invoice.subscriptions[0].subscription_id === id) {

        if(invoice_detail.invoice.payments.length > 0) {
          let paymentID = invoice_detail.invoice.payments[0].payment_id;
          const payment_detail = await zoho.retrievePayment(domain_url, organizationid, oauthtoken, paymentID);
          payments_detail_prev_info.push(payment_detail);
          await zoho.deletePayment(domain_url, organizationid, oauthtoken, paymentID);

          let invoiceID = invoice_detail.invoice.invoice_id;
          await zoho.deleteInvoice(domain_url, organizationid, oauthtoken, invoiceID);
        }
        else {
          let invoiceID = invoice_detail.invoice.invoice_id;
          await zoho.deleteInvoice(domain_url, organizationid, oauthtoken, invoiceID);
        }

        //Eliminar las suscripciones correspondientes
        for(subscription of subscriptions) {
          await zoho.deleteSubscription(domain_url, organizationid, oauthtoken, subscription.id);
        }

        //Creación de la nueva suscripción con plan corregido
        for(subscription of subscriptions) {
          const custom_fields = await get_subscription_cf(subscription);
          const zoho_body = await get_zoho_body_add_subscription(client, subscription, custom_fields);
          await zoho.addNewSubscription(domain_url, organizationid, oauthtoken, zoho_body);
        }

        //Finalmente actualizar información en base de datos
        const inv_details_prev_info = JSON.stringify(invoices_detail_prev_info);
        const pay_details_prev_info = JSON.stringify(payments_detail_prev_info);

        //Acreditación del pago en cuestión y asociación a la nueva suscripción
        if(invoice_detail.invoice.status === "paid" || invoice_detail.invoice.status === "partially_paid") {
          has_credit = 1;

          let client_details = await process_client_details(domain_url, organizationid, oauthtoken, client, payments_detail_prev_info[0]);
          
          console.log("DETALLE ==>", client_details);
          await zoho.addCreditViaPayment(domain_url, organizationid, oauthtoken, client_details);
          
        }

        //Actualización del registro
        await uisp.updateLeClient(client.uispdbID, subscriptions_prev_info, invoices_prev_info, inv_details_prev_info, pay_details_prev_info, has_credit, 1);
        console.log("CLIENTE_ACTUALIZADO_uispdbID ===>", client.CustomerIDZoho);
      }
    }
  }
}

async function process_client_details(domain_url, organizationid, oauthtoken, client, payment_details) {
  //Custom fields
  let custom_fields = [];

  const custom_fields_payment = payment_details.payment.custom_fields;

  for(custom_field of custom_fields_payment) {
    let jsn = {
      "label": custom_field.label,
      "value": custom_field.value
    }
    custom_fields.push(jsn);
  }

  //Details from new invoice
  const {invoices: new_invoice} = await zoho.get_all_invoices(domain_url, organizationid, oauthtoken, client.CustomerIDZoho);
  //Payment body for zoho
  let jsn = {
    "customer_id": client.CustomerIDZoho,
    "amount": payment_details.payment.amount,
    "date": payment_details.payment.date,
    "payment_mode": payment_details.payment.payment_mode,
    "reference_number": payment_details.payment.reference_number,
    "custom_fields": custom_fields,
    "description": payment_details.payment.description,
    "invoices": [
      {
        "invoice_id": new_invoice[0].invoice_id,
        "invoice_number": new_invoice[0].number,
        "date": payment_details.payment.invoices[0].date,
        "invoice_amount": new_invoice[0].total,
        "amount_applied": new_invoice[0].total,
        "balance_amount": new_invoice[0].balance
      }
    ]
  }

  return jsn;
}

//Funciones para corregir personas con plan Wireless que poseen IVA
//Se reutiliza funciones de get_subscription_cf y get_zoho_body_add_subscription
async function analyze_subscriptions_IVA_clients(subscriptions) {
  let subscriptions_array = [];

  for(let subscription of subscriptions) {
    let jsn = {
      "id": subscription.subscription_id,
      "plan_code": subscription.plan_code,
      "price_sub_total": subscription.sub_total,
      "custom_fields": subscription.custom_fields,
      "starts_at": subscription.activated_at
    }
    subscriptions_array.push(jsn);
  }
  return subscriptions_array;
}

async function process_IVA_client(domain_url, organizationid, oauthtoken, subscriptions, invoices, client, subscriptions_prev_info, invoices_prev_info) {
  //Análisis suscripciones para limpieza y cargo de créditos
  let invoices_detail_prev_info = [];
  let payments_detail_prev_info = [];
  let has_credit = 0;

  for(let subscription of subscriptions) {
    let id = subscription.id;
    
    for(invoice of invoices) {
      const invoice_detail = await zoho.get_invoice_detail(domain_url, organizationid, oauthtoken, invoice.invoice_id);
      invoices_detail_prev_info.push(invoice_detail);

      if(invoice_detail.invoice.subscriptions[0].subscription_id === id) {

        if(invoice_detail.invoice.payments.length > 0) {
          let paymentID = invoice_detail.invoice.payments[0].payment_id;
          const payment_detail = await zoho.retrievePayment(domain_url, organizationid, oauthtoken, paymentID);
          payments_detail_prev_info.push(payment_detail);
          await zoho.deletePayment(domain_url, organizationid, oauthtoken, paymentID);

          let invoiceID = invoice_detail.invoice.invoice_id;
          await zoho.deleteInvoice(domain_url, organizationid, oauthtoken, invoiceID);
        }
        else {
          let invoiceID = invoice_detail.invoice.invoice_id;
          await zoho.deleteInvoice(domain_url, organizationid, oauthtoken, invoiceID);
        }

        //Eliminar las suscripciones correspondientes
        for(subscription of subscriptions) {
          await zoho.deleteSubscription(domain_url, organizationid, oauthtoken, subscription.id);
        }

        //Creación de la nueva suscripción con plan corregido
        for(subscription of subscriptions) {
          const custom_fields = await get_subscription_cf(subscription);
          const zoho_body = await get_zoho_body_add_subscription(client, subscription, custom_fields);
          await zoho.addNewSubscription(domain_url, organizationid, oauthtoken, zoho_body);
        }

        //Finalmente actualizar información en base de datos
        const inv_details_prev_info = JSON.stringify(invoices_detail_prev_info);
        const pay_details_prev_info = JSON.stringify(payments_detail_prev_info);

        //Acreditación del pago en cuestión y asociación a la nueva suscripción
        if(invoice_detail.invoice.status === "paid" || invoice_detail.invoice.status === "partially_paid") {
          has_credit = 1;

          let client_details = await process_client_details(domain_url, organizationid, oauthtoken, client, payments_detail_prev_info[0]);
          
          console.log("DETALLE ==>", client_details);
          await zoho.addCreditViaPayment(domain_url, organizationid, oauthtoken, client_details);
          
        }

        //Actualización del registro
        await uisp.updateIVAClient(client.uispdbID, subscriptions_prev_info, invoices_prev_info, inv_details_prev_info, pay_details_prev_info, has_credit, 1);
        console.log("CLIENTE_ACTUALIZADO_uispdbID ===>", client.CustomerIDZoho);
      }
    }
  }
}
