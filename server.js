//import required libraries
var express		=	require('express');   // route manager
var session		=	require('express-session');  // used for authentication session
var bodyParser  	= 	require('body-parser');  //used to parse response data
var Client = require('node-rest-client').Client;  //used for invoking spark apis
var CryptoJS = require('crypto-js');  // used for md5 encryption

//create instance of express js - which manges the routes
var app			=	express();
//configure express settings
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

app.use(session({secret: 'joe-neuman',saveUninitialized: true,resave: true}));
app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));

//default users in our system
let users = [{email: 'abc@test.com', password: 'pass'},
			{email: 'abcd@test.com', password: 'pass'}]
var sess;

// the default route handler, when you just type application url, this will be invoked
app.get('/',function(req,res){
	//get session from requet object
	sess=req.session;
	// if session exists (means already authenticated) then redirect to home else to login page
	if(sess.email)
	{
		res.redirect('/home');
	}
	else{
	res.render('index.html');
	}
});

//when login form is submitted, validate the user by comparing against default user list
//and if username and passwrod match, set the session object value
app.post('/login',function(req,res){
	sess=req.session;	
	let email = req.body.email;
	let password = req.body.pass;
	for(let user of users) {
		if(user.email == email && user.password == password) {
			sess.email=req.body.email;
			res.end('done');
		}
	}
	res.end('fail');
	
});

//when authenticated, user can come to this page where we will show the list of contacts fetched 
//through API
app.get('/home',function(req,res){
	sess=req.session;
	if(sess.email)	
	{
		let apiKey = 'stg_realzy_key_1';
		let apiSecret = '1u4woz04ebte2aczduvt4mr3u';

		//creat node rest client
		var client = new Client();
		// this header is must for Spark API
		var args = {
			data: {},
			headers: {'X-SparkApi-User-Agent': 'test'}
		};

		//Apply md5 caching 
		let authHash = CryptoJS.MD5(apiSecret+'ApiKey'+apiKey).toString();
		let authUrl = 'https://api.flexmls.com/v1/session?ApiKey='+apiKey+'&ApiSig='+authHash;
		//fire authentication post api call
		client.post(authUrl, args, function(data,response) {
			//retrieve authToken from api reponse data
			let authToken = data["D"]["Results"][0]["AuthToken"];
			let baseUrl = 'https://api.flexmls.com';
			let conactServicePath = '/v1/listings';
			//create url to fetch contacts
			let url = baseUrl + conactServicePath + '?AuthToken='+authToken+ '&ApiSig=' +
			CryptoJS.MD5(apiSecret+'ApiKey'+apiKey+'ServicePath'+conactServicePath+'AuthToken'+authToken);

			//fire get api call
			client.get(url, args, function(data,response) {

				//extract contacts from api response
				let contacts = data["D"]["Results"];

				//start writing the reponse html which is html created from the obtained contcts

				res.write('<head>')
				res.write('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">')
				res.write('</head>')
				res.write('<h2>Contacts API Results</h2>')
				res.write('<table class="table">');
				res.write('<thead><tr><td>BathsTotal</td><td>ListPrice</td>'+
				'<td>ListingId</td><td>MlsStatus</td><td>PropertySubType</td><td>City</td>'+

				'<td>MLSAreaMajor</td><td>MLSAreaMinor</td><td>PostalCode</td><td>StreetName</td><td>ListOfficeEmail</td></tr></thead><tbody>')
				for(let contact of contacts) {
					contact = contact.StandardFields;
					res.write('<tr>')
					res.write('<td>')
					res.write(contact.BathsTotal + '');
					res.write('</td>')

					res.write('<td>')
					res.write(contact.ListPrice + '');
					res.write('</td>')

					res.write('<td>')
					res.write(contact.ListingId + '');
					res.write('</td>')
					res.write('<td>')
					res.write(contact.MlsStatus + '');
					res.write('</td>')
					res.write('<td>')
					res.write(contact.PropertySubType + '');
					res.write('</td>')
					res.write('<td>')
					res.write(contact.City + '');
					res.write('</td>')
					res.write('<td>')
					res.write(contact.MLSAreaMajor + '');
					res.write('</td>')
					res.write('<td>')
					res.write(contact.MLSAreaMinor + '');
					res.write('</td>')
					
					res.write('<td>')
					res.write(contact.PostalCode + '');
					res.write('</td>')
					
					res.write('<td>')
					res.write(contact.StreetName + '');
					res.write('</td>')
					res.write('<td>')
					res.write(contact.ListOfficeEmail + '');
					res.write('</td>')


					res.write('</tr>')
				}
				res.write('</tbody></table>');
				res.end('<a href='+'/'+'>Logout</a>');
			})
		})

	}
	else
	{
		res.write('<h1>Please login first.</h1>');
		res.end('<a href='+'/'+'>Login</a>');
	}

});


//when logout is clicked , the session is cleared and redirected to login page
app.get('/logout',function(req,res){
	
	req.session.destroy(function(err){
		if(err){
			console.log(err);
		}
		else
		{
			res.redirect('/');
		}
	});

});

//applicaiton starts on port 3000, so access with localhost:3000
app.listen(3000,function(){
	console.log("App Started on PORT 3000");
});
