'use strict';

const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const app = express();

app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


let Jogadores = Array();
let Numeros = 120;
let Sorteado = Array(121);
let cardNums = 24;


const IntervaloSorteio = 5000; //Intervalo do Sorteio dos Numeros


wss.on('connection', function connection(ws, req) {
  const location = url.parse(req.url, true);

  
  ws.on('message', function incoming(message) {
	  var data = message.split("-");
	  
	  switch(data[0]){
	
		case "NC" : //Nova cartela
			ws.card = Array();
			ws.cardSelected = Array()
			 Jogadores.push(ws);
			 ws.send("NG");
			 
		break;
		case "C" : //Numeros da Cartela
			ws.card = data[1].split(",");			
		break
		case "S" : 
			ws.card.contains(data[1],function(){
				ws.cardSelected.push(data[1]);
			});
		break;
		case "B": //Butão de Bingo
			if(ws.cardSelected.length>=cardNums){
				let NumerosChekededs=0;
				Sorteado.forEach(function(N,index) {
		
					if(N){
						ws.cardSelected.forEach(function(n){
							if(n==index){
								NumerosChekededs++;
							}else{
								/*User lost*/
								ws.send("YL-YL");
								//console.log("Trapaça! Numero não sorteado");
							}
						});
						console.log("NuChe:"+NumerosChekededs);
					}else{
						/*User lost*/
						ws.send("YL-YL");
						//console.log("Trapaça! Numero não sorteado");
					}
				});
				if(NumerosChekededs>=cardNums){ 
					//*User win Game*/
					ws.send("YW-YW") 
					wss.broadcastEveryoneElse("YL-YL");
				}
			}else{
				/*User lost*/
				ws.send("YL-YL")  ;
				//console.log("A Cartela não foi toda preenchida");
			}
		break;
	  }
  });

  ws.on('close', function close() {
	Jogadores.splice(Jogadores.indexOf(ws), 1);
  });

});
/*Send to all*/
Jogadores.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};
/*this function Send to all less sender*/
Jogadores.broadcastEveryoneElse =   function broadcastEveryoneElse(data,J){
	wss.clients.forEach(function each(client) {
	  if (client !== J && client.readyState === WebSocket.OPEN) {
		client.send(data);
	  }
	});
};



/*To draw number*/
setInterval(function(){
	let newNum;
	do{
    	newNum = Math.floor(Math.random() * Numeros );
  	}while(Sorteado[newNum]);
	
	Sorteado[newNum] = 1;
	
	Jogadores.broadcast(`N-${newNum}`);
	
},IntervaloSorteio);


setInterval(function(){
	/*This function send statistic information */
	Jogadores.broadcast(`I-${Jogadores.length},${Jogadores.Pganhadores()}`);
},1000);


/*This function calculates the possibles winners**/
Jogadores.Pganhadores =function (){
	let ganhadores=0;
	Jogadores.forEach(function(J) {
		let  acertos = 0;
		Sorteado.forEach(function(Boolean,index) {
			J.card.forEach(function(n) {
				if(index==n){
					acertos++;					
				}
			});
		});
		if(acertos=>cardNums) ganhadores;
	});
	return ganhadores;
}


Array.prototype.contains = function(k, callback) {
    var self = this;
    return (function check(i) {
        if (i >= self.length) {
            return false;
        }

        if (self[i] === k) {
            return callback(k);
        }

        return process.nextTick(check.bind(null, i+1));
    }(0));
}

server.listen(8080, function listening() {
  console.log('Listening on %d', server.address().port);
});