import * as Cookies from "js-cookie";

export const myInitObject = {
    'nameCookie': 'aucultura',

    // 'crudServer': 'http://localhost:4001',              // backend localhost
    // 'appServer': 'http://localhost:8100',               // frontend localhost

    // 'crudServer': 'https://test.api.aucultur.eu',    // backend test server
    // 'appServer': 'https://test.aucultur.eu',         // frontend test server 

    'crudServer': 'https://api.aucultur.eu',         // backend production server
    'appServer': 'https://aucultur.eu',              // frontend production server

    // 'crudServer': 'https://api-aucultura.metricsalad.com',
    // 'appServer': 'https://aucultura.metricsalad.com',
    'pageSize': 10,
    'imgMaxSize': 10 * 1024 * 1024,
    'sexo': [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'O', label: 'Other' }]
};


export const setSessionCookie = (session) => {
    Cookies.remove(myInitObject.nameCookie);
    //Cookies.set(myInitObject.nameCookie, session, { expires: 14 });
};

export const getSessionCookie = () => {
    const sessionCookie = Cookies.get(myInitObject.nameCookie);
    if (sessionCookie === undefined) {
        return {};
    } else {
        //return JSON.parse(sessionCookie);
        return sessionCookie;
    }
};


