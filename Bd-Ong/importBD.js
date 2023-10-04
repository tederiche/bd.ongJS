// Função para importar arquivo
function importFile() {
  var fileInput = document.getElementById('fileInput');
  var file = fileInput.files[0];

  if (file) {
    var reader = new FileReader();

    reader.onload = function(event) {
      var fileContent = event.target.result;
      Papa.parse(fileContent, {
        header: true,
        complete: function(results) {
          var data = results.data;
          storeDataInIndexedDB(data);
        }
      });
    };

    reader.readAsText(file);
  } else {
    console.log('Nenhum arquivo selecionado.');
  }
}

// Função para armazenar os dados do CSV no IndexedDB
function storeDataInIndexedDB(data) {
  var request = indexedDB.open('test');

  request.onsuccess = function(event) {
    var db = event.target.result;
    var transaction = db.transaction(['users'], 'readwrite');
    var objectStore = transaction.objectStore('users');

    data.forEach(function(item) {
      // Adicione a data e hora atual ao objeto 'item'
      item.dataHora = new Date().toISOString();

      var addUserRequest = objectStore.add(item);

      addUserRequest.onsuccess = function() {
        console.log('Dados inseridos com sucesso!');
      };
    });

    transaction.oncomplete = function() {
      console.log('Dados importados com sucesso!');
      getDataFromIndexedDB(); // Recupera os dados atualizados do IndexedDB
    };
  };

  request.onerror = function(event) {
    console.log('Erro ao abrir o banco de dados:', event.target.error);
  };
}

// Função para preencher a tabela com os dados do IndexedDB
function fillTableWithData(data) {
  var tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';

  data.forEach(function(item) {
    var row = document.createElement('tr');
   

    console.log(item)

    for (var key in item) {
      console.log(key)
      var cell = document.createElement('td');
      if (key === 'imagem') {
        var image = document.createElement('img');
        image.src = item[key]; // Assumindo que o valor de 'imagem' é uma string base64 válida
        image.style.maxWidth = '100%'; // Defina um tamanho máximo para a imagem, se necessário
        cell.appendChild(image);
      } else {
        cell.textContent = item[key];
      }
      row.appendChild(cell);
    }

     // Multiplicação
     var multiplicacao = parseFloat(item.valor) * parseFloat(item.quantidade);
     var multiplicacaoCell = document.createElement('td');
     multiplicacaoCell.textContent = 'R$' + multiplicacao;
     row.appendChild(multiplicacaoCell);
 
    //criar botão editar
    var editButtonCell = document.createElement('td');
    var editButton = document.createElement('button');
    editButton.textContent = 'Editar';
    editButton.setAttribute('data-id', item.id); // Define o ID do usuário como atributo de dados
    editButton.addEventListener('click', openEditUserDialog); // Adiciona um ouvinte de evento ao botão "Editar"
    editButtonCell.appendChild(editButton);
    row.appendChild(editButtonCell);

    // Cria o botão de exclusão para o usuário atual
    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Excluir';
    deleteButton.addEventListener('click', function() {
      var userId = item.id; // Obtém o ID do usuário para exclusão
      deleteUserFromIndexedDB(userId); // Chama a função para excluir o usuário do IndexedDB
    });
    var deleteCell = document.createElement('td');
    deleteCell.appendChild(deleteButton);
    row.appendChild(deleteCell);

    tableBody.appendChild(row);
  });
}

// Função para recuperar os dados do IndexedDB
function getDataFromIndexedDB() {
  var request = indexedDB.open('test');

  request.onsuccess = function(event) {
    var db = event.target.result;

    var transaction = db.transaction(['users'], 'readonly');
    var objectStore = transaction.objectStore('users');

    var getAllRequest = objectStore.getAll();
    
    getAllRequest.onsuccess = function(event) {
      var data = event.target.result;
      fillTableWithData(data);
    };

    getAllRequest.onerror = function(event) {
      console.log('Erro ao recuperar os dados do IndexedDB:', event.target.error);
    };
  };

  request.onerror = function(event) {
    console.log('Erro ao abrir o banco de dados:', event.target.error);
  };
}

// abrir formulario para poder Editar o produto
function openEditUserDialog(event) {
  var userId = event.target.getAttribute('data-id');
  getUserFromIndexedDB(userId)
    .then(function(user) {
      if (user) {
        var editUserIdInput = document.getElementById('editUserId');
        var editProdutoInput = document.getElementById('editProduto');
        var editQualidadeInput = document.getElementById('editQualidade');
        var editValorInput = document.getElementById('editValor');
        var editQuantidadeInput = document.getElementById('editQuantidade');
        var editDescricaoInput = document.getElementById('editDescricao');

        // Preenche os campos do formulário com os dados do usuário
        editUserIdInput.value = user.id;
        editProdutoInput.value = user.produto;
        editQualidadeInput.value = user.qualidade;
        editValorInput.value = user.valor;
        editQuantidadeInput.value = user.quantidade;
        editDescricaoInput.value = user.descricao;

        // Exibe o formulário de edição
        var editUserDialog = document.getElementById('editUserDialog');
        editUserDialog.style.display = 'block';
      }
    })
    .catch(function() {
      console.log('Erro ao obter o usuário.');
    });
}

// Pegar Usuario BD para poder atualizar
function getUserFromIndexedDB(userId) {
  var request = indexedDB.open('test');

  return new Promise(function(resolve, reject) {
    request.onsuccess = function(event) {
      var db = event.target.result;
      var transaction = db.transaction(['users'], 'readonly');
      var objectStore = transaction.objectStore('users');

      var getRequest = objectStore.get(userId);

      getRequest.onsuccess = function(event) {
        var user = event.target.result;
        resolve(user);
      };

      getRequest.onerror = function(event) {
        console.log('Erro ao obter o usuário:', event.target.error);
        reject();
      };
    };

    request.onerror = function(event) {
      console.log('Erro ao abrir o banco de dados:', event.target.error);
      reject();
    };
  });
}

// Quando for clicado é cancelado a Atualização
function closeEditUserDialog() {
  var editUserDialog = document.getElementById('editUserDialog');
  editUserDialog.style.display = 'none';
}

//função pegar os campos e atualizar os produtos
function updateUserData() {
  var editUserIdInput = document.getElementById('editUserId');
  var editProdutoInput = document.getElementById('editProduto');
  var editQualidadeInput = document.getElementById('editQualidade');
  var editValorInput = document.getElementById('editValor');
  var editQuantidadeInput = document.getElementById('editQuantidade');
  var editDescricaoInput = document.getElementById('editDescricao');

  var userId = editUserIdInput.value;
  var updatedUserData = {
    produto: editProdutoInput.value,
    qualidade: editQualidadeInput.value,
    valor: editValorInput.value,
    quantidade: editQuantidadeInput.value,
    descricao: editDescricaoInput.value
  };

  updateUserDataInIndexedDB(userId, updatedUserData);
  closeEditUserDialog();
  getDataFromIndexedDB();
}

//Atualização de dados do produtos
function updateUserDataInIndexedDB(userId, updatedUserData) {
  var request = indexedDB.open('test');

  request.onsuccess = function(event) {
    var db = event.target.result;
    var transaction = db.transaction(['users'], 'readwrite');
    var objectStore = transaction.objectStore('users');

    var getRequest = objectStore.get(userId);

    getRequest.onsuccess = function(event) {
      var user = event.target.result;
      Object.assign(user, updatedUserData);

      var updateRequest = objectStore.put(user);

      updateRequest.onsuccess = function(event) {
        console.log('Dados do usuário atualizados com sucesso.');
      };

      updateRequest.onerror = function(event) {
        console.log('Erro ao atualizar os dados do usuário:', event.target.error);
      };
    };

    getRequest.onerror = function(event) {
      console.log('Erro ao obter o usuário:', event.target.error);
    };
  };

  request.onerror = function(event) {
    console.log('Erro ao abrir o banco de dados:', event.target.error);
  };
}

// Função para excluir um usuário do IndexedDB
function deleteUserFromIndexedDB(userId) {
  var request = indexedDB.open('test');

  request.onsuccess = function(event) {
    var db = event.target.result;
    var transaction = db.transaction(['users'], 'readwrite');
    var objectStore = transaction.objectStore('users');

    var deleteRequest = objectStore.delete(userId);

    deleteRequest.onsuccess = function() {
      console.log('Usuário excluído com sucesso!');
      getDataFromIndexedDB(); // Recarrega os dados do IndexedDB na tabela
    };

    deleteRequest.onerror = function(event) {
      console.log('Erro ao excluir o usuário:', event.target.error);
    };
  };

  request.onerror = function(event) {
    console.log('Erro ao abrir o banco de dados:', event.target.error);
  };
}

//Download CSV Atualizado
function downloadCSVFile(filename, csvContent) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Função para exportar os dados em um arquivo CSV
function exportDataToCSV() {
  var request = indexedDB.open('test');

  request.onsuccess = function(event) {
    var db = event.target.result;
    var transaction = db.transaction(['users'], 'readonly');
    var objectStore = transaction.objectStore('users');

    var getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = function(event) {
      var data = event.target.result;

      // Cria as linhas do CSV com os dados
      var csvRows = data.map(function(item) {
        return [
          item.dataHora,
          item.id,
          item.produto,
          item.qualidade,
          item.valor,
          item.quantidade,
          item.descricao
        ];
      });

      // Junta as linhas do CSV com quebras de linha
      var csvContent = csvRows.map(function(row) {
        return row.join(',');
      }).join('\n');

      var filename = 'dados.csv';
      downloadCSVFile(filename, csvContent);
    };

    getAllRequest.onerror = function(event) {
      console.log('Erro ao recuperar os dados do IndexedDB:', event.target.error);
    };
  };

  request.onerror = function(event) {
    console.log('Erro ao abrir o banco de dados:', event.target.error);
  };
}

//Atualização da tabela
function updateTable() {
  getDataFromIndexedDB();
}

// Função para obter o espaço livre do IndexedDB
function getFreeSpaceFromIndexedDB() {
  return new Promise(function(resolve, reject) {
    navigator.webkitPersistentStorage.queryUsageAndQuota(
      function(usedBytes, grantedBytes) {
        var freeBytes = grantedBytes - usedBytes;
        var freeSpace = formatBytes(freeBytes);
        resolve(freeSpace);
      },
      function(error) {
        console.log('Erro ao obter o espaço livre do IndexedDB:', error);
        reject();
      }
    );
  });
}

// Função para obter o espaço total do IndexedDB
function getTotalSpaceFromIndexedDB() {
  return new Promise(function(resolve, reject) {
    navigator.webkitPersistentStorage.queryUsageAndQuota(
      function(usedBytes, grantedBytes) {
        var totalSpace = formatBytes(grantedBytes);
        resolve(totalSpace);
      },
      function(error) {
        console.log('Erro ao obter o espaço total do IndexedDB:', error);
        reject();
      }
    );
  });
}

// Função para formatar os bytes em uma string legível
function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  var i = Math.floor(Math.log(bytes) / Math.log(1024));
  var formattedValue = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
  return formattedValue + ' ' + sizes[i];
}

// mostrar armazemanto usado e livre 
async function displaySpace() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      var estimate = await navigator.storage.estimate();
      var totalSpace = formatBytes(estimate.quota);
      var usedSpace = formatBytes(estimate.usage);

      document.getElementById('espacoLivre').textContent = totalSpace;
      document.getElementById('espacoUsado').textContent = usedSpace;
    } else {
      console.log('A API navigator.storage.estimate não é suportada neste navegador.');
    }
  } catch (error) {
    console.log('Erro ao exibir o espaço livre e ocupado:', error);
  }
}

// Atualização da tabela e exibição do espaço livre e ocupado
async function updateTableAndSpace() {
  await updateTable();
  await displaySpace();
}

// Chame a função updateTableAndSpace para obter os resultados desejados
updateTableAndSpace();

// Associar o evento de clique do botão de exportação
var exportButton = document.getElementById('exportButton');
exportButton.addEventListener('click', exportDataToCSV);


// Associar o evento de clique do botão de atualização
var updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', updateTable);
