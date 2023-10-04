// Abre uma conexão com o banco de dados 'test' na versão 1
const request = window.indexedDB.open('test', 1);
let db;
const imageInput = document.getElementById('imageInput'); // substitua 'imageInput' pelo ID do seu input file

function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Manipulador de evento chamado quando ocorre uma atualização de versão do banco de dados
request.onupgradeneeded = function(event) {
  // Obtém a referência para o banco de dados
  db = event.target.result;

  // Cria uma nova object store chamada 'users' com uma chave primária 'id' autoincrementável
  const objectStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });

  // Cria índices para diferentes campos na object store
  objectStore.createIndex('dia', 'dia', {unique: false});
  objectStore.createIndex('hora', 'hora', {unique: false})
  objectStore.createIndex('id', 'id', { unique: false });
  objectStore.createIndex('produto', 'produto', { unique: false });
  objectStore.createIndex('qualidade', 'qualidade', { unique: false });
  objectStore.createIndex('valor', 'valor', { unique: false });
  objectStore.createIndex('quantidade', 'quantidade', { unique: false });
  objectStore.createElement('genero', 'genero', {unique: false});
  objectStore.createIndex('descricao', 'descricao', { unique: false });
  objectStore.createIndex('imagem', 'imagem', { unique: false });
};

// Manipulador de evento chamado quando a conexão com o banco de dados é bem-sucedida
request.onsuccess = function(event) {
  // Obtém a referência para o banco de dados
  db = event.target.result;

  // Manipulador de evento para o envio do formulário
  const form = document.getElementById('myForm');
  form.addEventListener('submit', function(event) {
    event.preventDefault();

    // Obtém os valores dos campos do formulário
    const dia = document.getElementById('dia').value;
    const hora = document.getElementById('hora').value;
    const id = document.getElementById('id').value;
    const produto = document.getElementById('produto').value;
    const qualidade = document.getElementById('qualidade').value;
    const valor = document.getElementById('valor').value;
    const quantidade = document.getElementById('quantidade').value;
    const genero = document.getElementById('genero').value;
    const descricao = document.getElementById('descricao').value;
    
    const imageFile = imageInput.files[0];

    convertImageToBase64(imageFile).then(imagemBase64 => {
      // Inicia uma transação de leitura e escrita na object store 'users'
      const transaction = db.transaction('users', 'readwrite');
      const objectStore = transaction.objectStore('users');

      // Cria um novo usuário com os valores fornecidos, incluindo a imagem
      const newUser = {
        dia: dia,
        hora: hora,
        id: id,
        produto: produto,
        qualidade: qualidade,
        valor: valor,
        quantidade: quantidade,
        genero: genero,
        descricao: descricao,
        imagem: imagemBase64
      };

      // Adiciona o novo usuário à object store
      const addUserRequest = objectStore.add(newUser);

      // Manipulador de evento chamado quando o usuário é adicionado com sucesso
      addUserRequest.onsuccess = function() {
        console.log('Dados inseridos com sucesso!');
      };

      // Manipulador de evento chamado quando a transação é concluída
      transaction.oncomplete = function() {
        form.reset();
      };
    }).catch(error => {
      console.error('Erro ao converter a imagem para Base64:', error);
    });
  });

  // Manipulador de evento para o botão de exportar
  const exportButton = document.getElementById('exportButton');
  exportButton.addEventListener('click', exportDatabase);
};

// Manipulador de evento chamado quando ocorre um erro ao abrir o banco de dados
request.onerror = function(event) {
  console.error('Erro ao abrir o banco de dados:', event.target.error);
};

// Função auxiliar para baixar um arquivo CSV
function downloadCSVFile(filename, csvContent) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Função para exportar o banco de dados como um arquivo CSV
function exportDatabase() {
  // Inicia uma transação de somente leitura na object store 'users'
  const transaction = db.transaction('users', 'readonly');
  const objectStore = transaction.objectStore('users');

  // Abre um cursor para iterar sobre os dados na object store
  const exportRequest = objectStore.openCursor();
  const csvRows = [];

  // Manipulador de evento chamado quando o cursor é aberto com sucesso
  exportRequest.onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      // Obtém os dados do usuário atual do cursor
      const userData = cursor.value;

      // Cria uma linha CSV com os valores do usuário
      const csvRow = [
        userData.dia,
        userData.hora,
        userData.id,
        userData.produto,
        userData.qualidade,
        userData.valor,
        userData.quantidade,
        userData.genero,
        userData.descricao,
        userData.imagem
      ];

      // Adiciona a linha CSV ao array de linhas
      csvRows.push(csvRow);

      // Continua para o próximo usuário
      cursor.continue();
    } else {
      // Todos os dados foram percorridos

      // Cria o conteúdo CSV com base nas linhas
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      
      // Define o nome do arquivo CSV
      const filename = 'database.csv';

      // Baixa o arquivo CSV
      downloadCSVFile(filename, csvContent);
    }
  };

  // Manipulador de evento chamado quando ocorre um erro ao exportar os dados do banco de dados
  exportRequest.onerror = function(event) {
    console.error('Erro ao exportar os dados do banco de dados:', event.target.error);
  };
}
