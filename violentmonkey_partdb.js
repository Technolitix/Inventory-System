// ==UserScript==
// @name        PartDB ID Finder
// @namespace   Violentmonkey Scripts
// @match       https://yourPart-DB-instance.com/*
// @grant       GM_xmlhttpRequest
// @version     1.0
// @author      Technolitrix
// @description Super tolle Beschreibung und so wichtig
// ==/UserScript==

(function() {
    'use strict';

    // Search for elements with class "float-end"
    var floatEndElements = document.querySelectorAll(".float-end");
    if (floatEndElements.length > 0) {
        // Nimm das erste Element mit der Klasse "float-end"
        let content = floatEndElements[0].textContent;
        content = content.split(":");
        if (content.length > 1) {
            content = content[1].trim();
            content = parseInt(content, 10);

            // URL für die Anfrage
            const url = 'http://yourNodeRedservice:1880/inventoryid?getID=' + content;

            // Sende HTTP-Anfrage mit GM_xmlhttpRequest
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    console.log('GET-request send successfully:', response.responseText);
                },
                onerror: function(error) {
                    console.error('Error while sending GET-request:', error);
                }
            });
        } else {
            console.error('The element has no valid content for ID.');
        }
    } else {
        console.error('No element found with class "float-end".');
    }
})();
