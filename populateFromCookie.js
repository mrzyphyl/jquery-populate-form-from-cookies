(function ($) {
    $.fn.populateFromCookie = function (options) {
        // Default settings
        const defaultSettings   = { cookieName: 'defaultCookieName' };
        const currentPath       = window.location.pathname;

        // Base64 encoding and decoding functions
        const base64Encode = input => btoa(unescape(encodeURIComponent(input)));
        const base64Decode = input => decodeURIComponent(escape(atob(input)));

        // Cookie management functions
        const setCookie = (name, value, expiresHours, path) => {
            const expiryDate    = moment().add(expiresHours, 'hours').toDate();
            const expiration    = expiryDate.toISOString();
            const data          = JSON.stringify({ values: value, expiration });
            const cookieData    = `${name}=${base64Encode(data)}; expires=${expiryDate.toUTCString()}; path=${path}`;
            document.cookie     = cookieData;
        };

        const getCookie = name => {
            const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
            return match ? base64Decode(match[2]) : '';
        };

        const removeCookie = (name, path) => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
        };

        const isCookieExpired = (data) => {
            const { expiration } = JSON.parse(data);
            return moment().isAfter(expiration);
        };

        // Initialize plugin
        return this.each(function () {
            const $form         = $(this);
            const formId        = $form.attr('id');
            const settings      = $.extend({}, defaultSettings, options);
            const cookieName    = settings.cookieName;
            let cookieData      = getCookie(cookieName);

            // If the cookie is expired, remove it and exit early
            if (cookieData && isCookieExpired(cookieData)) {
                removeCookie(cookieName, currentPath);
                cookieData = ''; // Ensure cookie is empty
            }

            // Safely parse cookie data
            const parsedData    = cookieData ? JSON.parse(cookieData) : {};
            const formData      = parsedData.values || [];

            // Populate form fields from cookie data
            const populateFieldsFromCookie = () => {
                const formDataEntry = formData.find(entry => entry.id === formId);
                if (formDataEntry) {
                    const formFields = formDataEntry.inputs;
                    $form.find(':input').each(function () {
                        const fieldId = $(this).attr('id');
                        if (fieldId && formFields[fieldId] !== undefined) {
                            $(this).val(formFields[fieldId]);
                        }
                    });
                }
            };

            // Update cookie with form data on blur event
            const updateCookieOnBlur = () => {
                const formFields = {};
                
                // Get form input id and data
                $form.find(':input').each(function () {
                    const fieldId = $(this).attr('id');
                    if (fieldId) formFields[fieldId] = $(this).val();
                });

                // Update data object from cookies
                const updatedData   = { id: formId, inputs: formFields };

                // I'm still working for a more better approach for this variables lol
                const existingData  = getCookie(cookieName);
                const newData       = ((existingData ? JSON.parse(existingData) : {}).values || [])
                                        .filter(entry => entry.id !== formId)
                                        .concat(updatedData);

                setCookie(cookieName, newData, 0.5, currentPath); // 0.5 is setting to expire in 30 mins
            }

            // Attach event listeners for blur event
            $form.on('blur', ':input', updateCookieOnBlur);

            populateFieldsFromCookie();
            
        });
        
    };
    
})(jQuery);
