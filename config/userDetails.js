// Function to fetch user details based on user type and ID
async function getUserDetails(connection, loggedInUser) {
    if (!loggedInUser) {
        // If user is not logged in, return null or handle the case accordingly
        return null;
    }

    let userType = '';
    let details = [];

    if (loggedInUser.buyer_id) {
        userType = 'buyer';
        [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [loggedInUser.buyer_id]);
    } else if (loggedInUser.seller_id) {
        userType = 'seller';
        [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInUser.seller_id]);
    }

    return { userType, details };
}
module.exports={getUserDetails};