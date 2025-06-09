export function createConversation(db, data) {
    if (!db || !data) {
        return Promise.reject(new Error("Invalid database or data"))
    }

    return new Promise((resolve, reject) => {
        db.query("INSERT INTO conversations SET ?", [data], function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

// get conversation by id
export function getConversationByAgentId(db, agentId) {
    if (!db || !agentId) {
        return Promise.reject(new Error("Invalid database or id"))
    }

    // if id is not a number, return error
    if (isNaN(agentId)) {
        return Promise.reject(new Error("Id must be a number"))
    }

    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM conversations WHERE agent_id = ?", [agentId], function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

// get conversation by thread id
export function getConversationByThreadId(db, threadId) {
    if (!db || !threadId) {
        return Promise.reject(new Error("Invalid database or thread id"))
    }

    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM conversations WHERE thread_id = ?", [threadId], function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

// update conversation by id
export function updateConversationById(db, data, id) {
    if (!db || !data || !id) {
        return Promise.reject(new Error("Invalid database, data or id"))
    }

    // if id is not a number, return error
    if (isNaN(id)) {
        return Promise.reject(new Error("Id must be a number"))
    }

    return new Promise((resolve, reject) => {
        db.query("UPDATE conversations SET ? WHERE id = ?", [data, id], function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

// delete conversation by id
export function deleteConversationById(db, id) {
    if (!db || !id) {
        return Promise.reject(new Error("Invalid database or id"))
    }

    // if id is not a number, return error
    if (isNaN(id)) {
        return Promise.reject(new Error("Id must be a number"))
    }

    return new Promise((resolve, reject) => {
        db.query("DELETE FROM conversations WHERE id = ?", [id], function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}