// This is global response pattern
export function response(status, message, data) {
    return {
        status,
        message,
        data
    }
}

// This is global response pattern without data
export function responseWithoutData(status, message) {
    return {
        status,
        message
    }
}