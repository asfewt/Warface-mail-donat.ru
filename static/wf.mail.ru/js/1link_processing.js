(function () {
	var partnerScript = document.createElement('script');
	partnerScript.type = 'text/javascript';
	partnerScript.async = true;
	partnerScript.src = '//wf.mail.ru/1l/v1/hit/274.js?r=' + encodeURIComponent(document.referrer) + '&rnd=' + Math.random();
	var firstScript = document.getElementsByTagName('script')[0];
	firstScript.parentNode.insertBefore(partnerScript, firstScript);
})();