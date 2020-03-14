// Validates email address format
const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; 
    if(email.match(emailRegEx)) return true;
    else return false;
};

// Function which validates empty field
const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
};

// Signup validation function 
exports.validateSignupData = (data) => {
    let errors = {};

    // Errors returned for empty or incorrect email field
    if(isEmpty(data.email)) {
        errors.email = 'Must not be empty'
    } else if(!isEmail(data.email)) {
        errors.email = 'Must be a valid email address'
    };

    // Errors returned for empty or incorrect passwords
    if(isEmpty(data.password)) errors.password = 'Must not be empty';
    if(data.password !== data.confirmPassword)
        errors.confirmPassword = 'Passwords must match';
    if(isEmpty(data.handle)) errors.handle = 'Must not be empty';
  
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };

};

// Login validation function
exports.validateLoginData = (data) => {
    let errors = {};

    // Errors returned for empty email or password field
    if(isEmpty(data.email)) errors.email = 'Must not be empty';
    if(isEmpty(data.password)) errors.password = 'Must not be empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
};

exports.reduceUserDetails = (data) => {
    let userDetails = {};

    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if(!isEmpty(data.website.trim())) {
        if(data.website.trim().substring(0, 4) !== 'http') {
            userDetails.website = `http://${data.website.trim()}`;
        } else userDetails.website = data.website;  
    }
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;    

    return userDetails;
};
