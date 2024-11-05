const { dbClick, dbQueryClick } = require("../config/db");
const { hashPasswordTM, createTokenTM } = require("../config/encrypts");



const generateRandomId = (length) => {
    return [...Array(length)].map(() => Math.random().toString(36)[2]).join('');
};

let gray = "\x1b[90m"
module.exports = {
    setShorten: async (req, res) => {
        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        const { url , API_Shortener } = req.body;

        let id;
        let exists = true;

        while (exists) {
            id = generateRandomId(8); // Generate an 8-character random ID

            // Check if the ID already exists in the database
            const checkQuery = `
                SELECT COUNT(*) AS count
                FROM shortener s 
                WHERE s.id = ?
            `;

            try {
                const [rows] = await dbQueryClick(checkQuery, [id]);

                // If count is 0, the ID is unique and we can exit the loop
                exists = rows.count > 0;
            } catch (error) {
                console.error("Error checking ID existence:", error);
                return res.status(500).send({
                    success: false,
                    message: "Error checking ID existence."
                });
            }
        }

        let querySetShortener = `
            INSERT INTO shortener (url, id) VALUES (?, ?);
        `;

        let paramSetShortener = [url, id];

        try {
            await dbClick.execute(querySetShortener, paramSetShortener);
            console.log(timestamp, "Insert Short URL SUCCESS");
            return res.status(200).send({
                success: true,
                message: "Short URL created successfully.",
                shortUrl: `${API_Shortener}/${id}`
            });
        } catch (err) {
            console.log(timestamp, "Error inserting short URL:", err);
            return res.status(500).send({
                success: false,
                message: err
            });
        }
    },
    setShortenCustom: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // console.log("dataToken", dataToken)

        const { url, id, API_Shortener } = req.body;

        let querySetShortener =
            `
                        INSERT INTO shortener
                            (url, id)
                            VALUES
                            ( ?, ? );

                    `;

        let paramSetShortener = [url, id];

        try {
            await dbClick.execute(querySetShortener, paramSetShortener);
            console.log(timestamp, " Insert Short ULR SUCCESS");
            return res.status(200).send({

                success: true,
                message: "Approval updated successfully.",
                shortUrl: `${API_Shortener}/${id}`

            });
        } catch (err) {
            console.log(timestamp, " UPDATE t_approval_event case 7: IT Support error", err);
            return res.status(500).send({
                success: false,
                message: err
            });
        }

    },
    getShorten: async (req, res) => {

        let date = new Date();
        let timestamp = gray + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // console.log("dataToken", dataToken)
        shortenlink = req.params.id

        queryCheckUrl =
            `
                                select
                                    url
                                from
                                    shortener
                                where
                                    id = ?
                                    
                                `

        dbClick.execute(queryCheckUrl, [shortenlink], (err, results) => {
            if (err) {
                console.log(timestamp, "Error with approval count", err);
                res.status(404).send('URL not found');
            } else {
                console.log("results", results)
                console.log("shortenlink", shortenlink)

                if (results[0] === undefined) {
                    // No results found
                    return res.status(504).send('URL not found');
                } else {

                    console.log("results", results[0])

                    const url = results[0].url; // Extract the URL from the results
                    console.log(timestamp, "Redirecting to:", url);
                    return res.status(200).send({

                        success: true,
                        message: "Approval updated successfully.",
                        shortUrl: `${url}`

                    });
                }
            }
        }
        )




    }

}