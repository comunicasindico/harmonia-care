
/* ====================================================
CARREGAR CLINICO
==================================================== */

async function carregarClinico(){

const {data,error}=await db
.from("pacientes")
.select("*")
.order("nome_completo")

if(error){
console.error(error)
return
}

let html=""

data.forEach(p=>{

html+=`

<tr>

<td>${p.nome_completo}</td>
<td>${calcularIdade(p.data_nascimento)}</td>
<td>${p.has?"✔":""}</td>
<td>${p.dm?"✔":""}</td>
<td>${p.da?"✔":""}</td>
<td>${p.cardiopatia?"✔":""}</td>
<td>${p.acamado?"✔":""}</td>
<td>${p.pressao_arterial??""}</td>
<td>${p.dieta_especial?"✔":""}</td>
<td>${p.grau_risco??""}</td>
<td>${p.outras_comorbidades??""}</td>

</tr>

`

})

document.getElementById("quadroClinico").innerHTML=html

}

/* ====================================================
CALCULAR IDADE
==================================================== */

function calcularIdade(data){

if(!data) return ""

const nascimento=new Date(data)
const hoje=new Date()

let idade=hoje.getFullYear()-nascimento.getFullYear()

const m=hoje.getMonth()-nascimento.getMonth()

if(m<0 || (m===0 && hoje.getDate()<nascimento.getDate())){
idade--
}

return idade

}
