const spanish = {
	error: {
		BLOCKED_USER: `Lo sentimos! Este usuario se encuentra bloqueado. Por favor comuníquese con atención al cliente sí cree que esto es un error.`,
		EMAIL_NOT_FOUND: `No se ha encontrado un usuario registrado con este correo.`,
		EMAIL_NOT_REGISTERED: `El correo ingresado no se encuentra registrado`,
		EMAIL_ALREADY_REGISTER: 'El correo ya se encuentra registrado',
		EMPTY_EMAIL: `Debe ingresar su correo para continuar.`,
		EMPTY_PASSWORD: `Debe ingresar su contraseña para continuar.`,
		INVALID_EMAIL: `El formato del correo ingresado es invalido. Por favor, verifique que su correo no tenga errores.`,
		INVALID_TOKEN: `El token no es valido`,
		SESSION_EXPIRED: `Su sesión ha expirado. Por favor, inicie sesión de nuevo sí desea continuar utilizando nuestros servicio.`,
		SYSTEM_ERROR: `Ha ocurrido un error interno procesando su solicitud. Sí tiene inconvenientes, por favor contacte a un administrador.`,
		UNAUTHORIZED_ACCESS: `Acceso no autorizado ಠ_ಠ `,
		UNAUTHORIZED_ACCESS_TOKEN: `Acceso no autorizado - token ( ͡° ʖ̯ ͡°)`,
		WRONG_PASSWORD: `La contraseña que ha ingresado es incorrecta.`,
		WRONG_REGISTER: `Ha ocurrido un error al registrar sus datos. Por favor, intente nuevamente`,
		WRONG_EMAIL: `El correo ingresado no es valido`,
		STATE_ERROR: `Ha ocurrido un error al obtener los estados`,
		STATE_REGISTER_ALREADY: 'Este estado ya se encuentra registrado',
		CITY_REGISTER_ALREADY: 'Esta ciudad ya se encuentra registrada',
		CITY_REGISTER_ERROR: 'Ha ocurrido un error al registrar la ciudad',
		CITY_ERROR: `Ha ocurrido un error al obtener las ciudades`,
		CITY_ERROR_ONE: `Ha ocurrido un error al obtener la ciudad`,
		CITY_ERROR_DELETE	: `Ha ocurrido un error al eliminar la ciudad`,
		CITY_ERROR_UPDATE: `Ha ocurrido un error al actualizar la ciudad`,
		LAYER_ERROR: 'Ha ocurrido un error al obtener las capas',
		LAYER_ERROR_ONE: 'Ha ocurrido un error al obtener la capa solicitada',
		LAYER_UPDATE_ERROR: 'Ha ocurrido un error al actualizar su capa',
		SERVICES_REGISTER_ERROR: 'Ha ocurrido un error al agregar su servicio',
		SERVICES_ERROR: 'Ha ocurrido un error al obtener los servicios',
		SERVICES_ERROR_ONE: 'Ha ocurrido un error al obtener el servicio',
		SERVICES_UPDATE_ERROR: 'Ha ocurrido un error al actualizar el servicio',
		SERVICES_ERROR_DELETE: `Ha ocurrido un error al eliminar el servicio`,
		STATE_CITY_ERROR: 'Ha ocurrido un error al obtener las ciudades del estado seleccionado',
		SET_MAP_ERROR: 'Ha ocurrido un error al agregar el area del mapa',
		PASSWORD_ERROR: 'Ha ocurrido un error al actualizar la contraseña'
	},
	success: {
		PASSWORD_CHANGED: `Su contraseña ha sido actualizada.`,
		PHONE_NUMBER_CHANGED: `Su número de teléfono ha sido actualizado.`,
		EMAIL_CHANGED: `Su correo electrónico ha sido actualizado.`,
		USER_REGISTER: `Registro exitoso.`,
		STATE_REGISTER: 'Estado registrado exitosamente',
		STATE_UPDATE: `Su estado ha sido actualizado.`,
		CITY_REGISTER: 'Ciudad registrada exitosamente',
		CITY_UPDATE: `La ciudad ha sido actualizada`,
		LAYER_UPDATE: 'La capa ha sido actualizada',
		SERVICES_REGISTER: 'El servicio ha sido registrado existosamente',
		SERVICES_UPDATE: 'El servicio ha sido actualizado',
		SET_MAP: 'Su informacion se ha registrado existosamente',
		UPDATE_MAP_AREA: 'El area ha sido actualizada',
		API_INTEGRATION: 'La información ha sido actializada',
		MAP_HELP_UPDATE: 'La ayuda del mapa ha sido actualizada',
		MAP_PICTURE_UPDATE: 'La imagen en GoMap ha sido actualizada',
		DRAW_TYPE_ADDED: 'El tipo de dibujo ha sido agregado',
		DRAW_TYPE_UPDATE: 'El tipo de dibujo ha sido actualizado',
		INFO_MAP_UPDATE: 'La información del info window ha sido actualizado',
		COMPANY_REGISTER: 'La compañia ha sido registrada',
		COLLAPSE_DATA: 'La data del collapse ha sido actualizada',
		URL_VERSION: 'Versión del catálogo de producto de GoPay ha sido actualizado',
    USER_INSERTED: 'Usuario registrado',
		GOZELLE_PICTURE_UPDATE: 'La imagen en GoZelle ha sido actualizada',
    USER_UPDATED: 'El usuario se ha actualizado',
	}
};

const english = {
	error: {        
		BLOCKED_USER: `We are sorry! This user is currently blocked. Please contact client support if you think this is an error.`,
		EMAIL_NOT_FOUND: `User registered with this email was not found.`,
		EMAIL_NOT_REGISTERED: `The email is not register.`,
		EMAIL_ALREADY_REGISTER: 'The email is already register',
		EMPTY_EMAIL: `You must write your e-mail to continue.`,
		EMPTY_PASSWORD: `You must write your password to continue.`,
		INVALID_EMAIL: `The e-mail format is not correct. Please verify e-mail.`,
		INVALID_TOKEN: `The token is not correct`,
		SESSION_EXPIRED: `Your session has expired. Please, log in again if you wish to continue.`,
		SYSTEM_ERROR: `An error has occurred while processing your request. If you have any inconveniences, please contact an administrator.`,
		UNAUTHORIZED_ACCESS: `Unauthorized access ಠ_ಠ `,
		UNAUTHORIZED_ACCESS_TOKEN: `Unauthorized access - token ( ͡° ʖ̯ ͡°)`,
		WRONG_PASSWORD: `The password you typed is incorrect. Please, verify your password and try again.`,
		WRONG_REGISTER: `An error has occurred while we register your information. Please, try again.`,
		WRONG_EMAIL: `The email is not valid`,
		STATE_ERROR: `An error occurred obtaining the states`,
		STATE_REGISTER_ALREADY: 'The state is already registered',
		CITY_REGISTER_ALREADY: 'The city is already registered',
		CITY_REGISTER_ERROR: 'An error has occurred while we register your city. Please try again',
		CITY_ERROR: `An error occurred obtaining the cities`,
		CITY_ERROR_ONE: `An error occurred obtaining the city`,
		CITY_ERROR_DELETE: `An error occurred deleting the city`,
		CITY_ERROR_UPDATE: `An error occurred updating the city`,
		LAYER_ERROR: 'An error occurred obtaining the layers',
		LAYER_ERROR_ONE: 'An error occurred obtaining the layer',
		LAYER_UPDATE_ERROR: 'An error occurred updating the layer',
		SERVICES_REGISTER_ERROR: 'An error ocurred adding the service',
		SERVICES_UPDATE_ERROR: 'An error occurred updating the services',
		SERVICES_ERROR_DELETE: `An error occurred deleting the services`,
		STATE_CITY_ERROR: 'An error ocurred obtaining cities by the selected state',
		SET_MAP_ERROR: 'An error ocurred adding the map area',
		PASSWORD_ERROR: 'An error occurred updating the password'
	},
	success: {
		PASSWORD_CHANGED: `Your password has been updated.`,
		PHONE_NUMBER_CHANGED: `Your phone number has been updated`,
		EMAIL_CHANGED: `Your email has been updated`,
		USER_REGISTER: `Successfully user register`,
		STATE_REGISTER: 'Successfully state register',
		STATE_UPDATE: `Your state has been updated`,
		CITY_REGISTER: 'Successufully city register',
		CITY_UPDATE: `Your city has been updated`,
		LAYER_UPDATE: 'Your layer has been updated',
		SERVICES_REGISTER: 'Successfully services register',
		SERVICES_UPDATE: 'Your services has been updated',
		SET_MAP: 'Successfully information register',
		UPDATE_MAP_AREA: 'Your area has been updated',
		API_INTEGRATION: 'The information has been updated',
		MAP_HELP_UPDATE: 'The map help has been updated',
		MAP_BRAND_UPDATE: 'The branding has been updated',
		MAP_PICTURE_UPDATE: 'The GoMap picture has been updated',
		DRAW_TYPE_ADDED: 'The draw type has been added',
		DRAW_TYPE_UPDATE: 'The draw type has been updated',
		INFO_MAP_UPDATE: 'The info window has been updated',
		COMPANY_REGISTER: 'Successfully company register',
		COLLAPSE_DATA: 'Collapse text updated',
		URL_VERSION: 'GoPay catalog version has been updated',
    USER_INSERTED: 'User registered',
		GOZELLE_PICTURE_UPDATE: 'The GoZelle picture has been updated',
    USER_UPDATED: 'User has been updated'
	}
};

const langServer = {
	es: spanish,
	en: english,
	default: english
};

module.exports.responseFromServer = function(lang) {
	let selectedLang = lang;

	if(selectedLang == null || selectedLang == undefined) {
			selectedLang = langServer['default'];
	}
	else {
			selectedLang = langServer[lang];
	}    

	return selectedLang;
}
