const redBoxShadow = '0 0 14px rgba(255, 70, 70, 0.8)';
const greenBoxShadow = '0 0 14px rgba(70, 255, 89, 0.8)';

function verifEmail(emailInputId) {
	let email = document.getElementById(emailInputId);
	if (isValidEmail(email.value)) {
		email.style.boxShadow = greenBoxShadow;
		return true;
	} else {
		email.style.boxShadow = redBoxShadow;
		return false;
	}
}

function isValidEmail(email) {
	let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	return emailPattern.test(email);
}

function verifText(textInputId, actions=['min'], limits=[0]) {
	let text = document.getElementById(textInputId);
	var result = true;
	for (let i = 0; i <= actions.length; i++) {
		if (actions[i]=="min") {
			if (text.value.length < limits[i]) {
				result = false;
			}
		} else if (actions[i]=="max") {
			if (text.value.length > limits[i]) {
				result = false;
			}
		}
	}
	if (result) {
		text.style.boxShadow = greenBoxShadow;
		return true;
	} else {
		text.style.boxShadow = redBoxShadow;
		return false;
	}
}
