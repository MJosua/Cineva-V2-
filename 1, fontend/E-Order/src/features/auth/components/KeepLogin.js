const res = await Axios.get(API_URL + '/auth/keep_login', {
    headers: {
        Authorization: `Bearer ${userToken}`,
    },
});
localStorage.setItem('token', res.data[1]);

if (res.data[0].uid) {
    // Modify as per your needs, assuming you have defined dispatch and loginAction correctly
    dispatch(loginAction(res.data[0]));
}
                } catch (err) {
    navigate('/'); // Assuming navigate function is available in props
    logoutAction(); // Assuming logoutAction function is available in props
}
            }
        };

fetchData();
    }, [userToken, dispatch, loginAction, navigate, logoutAction]);

return null; // You can return null if this component doesn't render anything
};

export default KeepLogin;





