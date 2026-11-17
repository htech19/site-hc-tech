const fs=require('fs'); let c=fs.readFileSync('src/sistema/pages/SistemaUsuariosPage.tsx','utf8'); c=c.replace('u.email?.toLowerCase().includes(busca.toLowerCase())', 'u.email?.toLowerCase().includes(busca.toLowerCase()) ||
    u.cpf_cnpj?.includes(busca)'); fs.writeFileSync('src/sistema/pages/SistemaUsuariosPage.tsx',c); console.log('OK');
