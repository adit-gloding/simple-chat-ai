// create agent
export function createAgent(db, data) {
    if (!db || !data) {
        return Promise.reject(new Error("Invalid database or data"))
    }

    return new Promise((resolve, reject) => {
        db.query("INSERT INTO agents SET ?", [data], function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

// get all agents
export function getAllAgents(db) {

    if (!db) {
        return Promise.reject(new Error("Invalid database"))
    }

    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM agents ORDER BY id DESC", function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

// get agent by id
export function getAgentById(db, id) {

    if (!db || !id) {
        return Promise.reject(new Error("Invalid database or id"))
    }

    // if id is not a number, return error
    if (isNaN(id)) {
        return Promise.reject(new Error("Id must be a number"))
    }

    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM agents WHERE id = ?", [id], function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

// update agent by id
export function updateAgentById(db, data, id) {

    if (!db || !data || !id) {
        return Promise.reject(new Error("Invalid database, data or id"))
    }

    // if id is not a number, return error
    if (isNaN(id)) {
        return Promise.reject(new Error("Id must be a number"))
    }

    return new Promise((resolve, reject) => {
        db.query("UPDATE agents SET ? WHERE id = ?", [data, id], function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

// delete agent by id
export function deleteAgentById(db, id) {
    if (!db || !id) {
        return Promise.reject(new Error("Invalid database or id"))
    }

    // if id is not a number, return error
    if (isNaN(id)) {
        return Promise.reject(new Error("Id must be a number"))
    }

    return new Promise((resolve, reject) => {
        db.query("DELETE FROM agents WHERE id = ?", [id], function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

