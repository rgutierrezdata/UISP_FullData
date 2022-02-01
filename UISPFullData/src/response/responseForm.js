module.exports.success = function(_data) {
	return {
		success: true,
		data: _data
	};
}

module.exports.error = function(_message) {
	return {
		success: false,
		error: {
			message: _message
		}
	};
}