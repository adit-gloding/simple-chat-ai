export function validate(body, requiredFields) {

    if (requiredFields && requiredFields.length > 0) {
        for (let field of requiredFields) {
            if (!body[field]) {
                return `Missing required field: ${field}`;
            }
        }
    }

    return null;
}