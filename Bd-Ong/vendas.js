// Variaveis e objetos globais
var quantities = {};
var totalPrice = {};
var cartTotalPrice = 0; 
var data;
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
          data = results.data;
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


// Crie um objeto para armazenar as quantidades dos itens
var quantidades = {};

// Função para preencher a tabela com os dados do IndexedDB
function fillTableWithData(data) {
  var tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';

  data.forEach(function(item) {
    var row = document.createElement('tr');
    var isStockLow = false;
     

    for (var key in item) {
      var cell = document.createElement('td');
      if (key === 'imagem') {
        var image = document.createElement('img');
        image.src = item[key];
        image.style.maxWidth = '100%';
        cell.appendChild(image);
      } else if (key === 'dia' || key === 'hora') {
        cell.className = 'hidden';
      } else{
        cell.textContent = item[key];
      }
      row.appendChild(cell);
    }


    var checkboxCell = document.createElement('td');
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', function() {
      toggleQuantityInput(checkbox, item.id);
    });
    checkboxCell.appendChild(checkbox);
    row.appendChild(checkboxCell);

    var inputCell = document.createElement('td');
    var input = document.createElement('input');
    input.type = 'number';
    input.disabled = true;
    input.addEventListener('change', function() {
      updateQuantity(item.id, input.value);
    });
    inputCell.appendChild(input);
    row.appendChild(inputCell);

    var addButtonCell = document.createElement('td');
    var addButton = document.createElement('button');
    addButton.textContent = 'Adicionar ao carrinho';
    addButton.setAttribute('data-id', item.id);
    addButton.addEventListener('click', function() {
      addToCart(item.id);
    });
    addButtonCell.appendChild(addButton);
    row.appendChild(addButtonCell);

    tableBody.appendChild(row);

    // Verifica se o estoque está baixo
    if (parseFloat(item.quantidade) <= 10) {
      isStockLow = true;
    }

    // Armazena a quantidade do item no objeto 'quantidades'
    quantidades[item.id] = parseFloat(item.quantidade);
  });
  console.log("Data", data)
}

// Função para alternar a entrada de quantidade
function toggleQuantityInput(checkbox, itemId) {
  var input = checkbox.parentNode.nextElementSibling.firstChild;
  input.disabled = !checkbox.checked;
  if (!checkbox.checked) {
    input.value = '';
    updateQuantity(itemId, '');
  }
}

// Função para atualizar a quantidade
function updateQuantity(itemId, value) {
  quantidades[itemId] = parseFloat(value);
  updateTotalPrice();
}



// Função para adicionar ao carrinho
function addToCart(itemId) {
  var quantity = quantidades[itemId];
  var item = null; // Adicione essa linha para inicializar a variável
  var currentDate = new Date();
  var currentDateTime = currentDate.toLocaleString();

  var cartRow = document.createElement('tr');
  cartRow.setAttribute('data-date-time', currentDateTime);
  for (var i = 0; i < data.length; i++) {
    if (data[i].id === itemId) {
      item = data[i];
      break;
    }
  }

  if (item && quantity > 0) {
    var itemTotalPrice = parseFloat(item.valor) * quantity;

    // Adicione o item ao carrinho
    var cartTableBody = document.getElementById('cart-table-body');
    var cartRow = document.createElement('tr');
    cartRow.setAttribute('data-date-time', currentDateTime);

    var nameCell = document.createElement('td');
    nameCell.textContent = item.produto;
    cartRow.appendChild(nameCell);

    var priceCell = document.createElement('td');
    priceCell.textContent = item.valor;
    cartRow.appendChild(priceCell);

    var quantityCell = document.createElement('td');
    quantityCell.textContent = quantity;
    cartRow.appendChild(quantityCell);

    var totalCell = document.createElement('td');
    totalCell.textContent = itemTotalPrice;
    cartRow.appendChild(totalCell);

    var deleteCell = document.createElement('td');
    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Excluir';
    deleteButton.setAttribute('data-id', itemId);
    deleteButton.addEventListener('click', function() {
      removeFromCart(itemId);
    });
    deleteCell.appendChild(deleteButton);
    cartRow.appendChild(deleteCell);

    cartTableBody.appendChild(cartRow);

    // Atualiza o preço total do carrinho
    cartTotalPrice += itemTotalPrice;
    updateTotalPrice();
  }
}

// Função para remover do carrinho
function removeFromCart(itemId) {
  var cartTableBody = document.getElementById('cart-table-body');
  var cartRows = cartTableBody.getElementsByTagName('tr');

  for (var i = 0; i < cartRows.length; i++) {
    var row = cartRows[i];
    var deleteButton = row.querySelector('button[data-id="' + itemId + '"]');

    if (deleteButton) {
      var priceCell = row.getElementsByTagName('td')[1];
      var totalCell = row.getElementsByTagName('td')[3];

      var itemTotalPrice = parseFloat(totalCell.textContent);
      cartTotalPrice -= itemTotalPrice;

      row.remove();
      updateTotalPrice();
      break;
    }
  }
}

function clearCart() {
  var cartTableBody = document.getElementById('cart-table-body');
  cartTableBody.innerHTML = '';

  cartTotalPrice = 0;
  updateTotalPrice();
}

// Função para atualizar o preço total
function updateTotalPrice() {
  var total = 0;
  for (var itemId in quantidades) {
    var quantity = quantidades[itemId];
    var item;
    for (var i = 0; i < data.length; i++) {
      if (data[i].id === itemId) {
        item = data[i];
        break;
      }
    }
    if (item) {
      var price = parseFloat(item.valor);
      var totalPrice = price * quantity;
      total += totalPrice;
    }
  }
  totalPrice = total;
  var totalPriceElement = document.getElementById('total');
  totalPriceElement.textContent = 'Total: ' + cartTotalPrice;
}

// Recupera os dados do IndexedDB e preenche a tabela
function getDataFromIndexedDB() {
  var request = indexedDB.open('test');

  request.onsuccess = function(event) {
    var db = event.target.result;
    var transaction = db.transaction(['users'], 'readonly');
    var objectStore = transaction.objectStore('users');
    var getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = function(event) {
      data = event.target.result;
      fillTableWithData(data);
    };
  };

  request.onerror = function(event) {
    console.log('Erro ao abrir o banco de dados:', event.target.error);
  };
}

// Função para exportar os dados do carrinho para um arquivo CSV
function exportCartToCSV() {
  // Cria o conteúdo do CSV com base nos dados do carrinho
  var csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Produto,Valor,Quantidade,Total\r\n";

  var cartTableBody = document.getElementById('cart-table-body');
  var rows = cartTableBody.getElementsByTagName('tr');

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var cells = row.getElementsByTagName('td');

    var produto = cells[0].textContent;
    var valor = cells[1].textContent;
    var quantidade = cells[2].textContent;
    var total = cells[3].textContent;
    var dataHora = row.getAttribute('data-date-time');

    var itemId = row.getAttribute('data-id');
    var dateValue = row.getAttribute('data-date');
    if (itemId && dateValue) {
      var formattedDateTime = new Date(dateValue).toLocaleString();
      dataHora = formattedDateTime;
    }
    csvContent += produto + "," + valor + "," + quantidade + "," + total + "," + dataHora + "\r\n";
 
    for (var j = 0; j < data.length; j++) {
      if (data[j].Produto === produto) {
        data[j].Quantidade -= parseFloat(quantidade);
        break;
      }
    }
  }

  var encodedUri = encodeURI(csvContent);
  window.open(encodedUri);

  // Cria um objeto Blob com o conteúdo do CSV para outros navegadores
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Cria um link de download
  var link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "compra.csv");

  // Clica no link para iniciar o download do arquivo
  link.click();

  // Atualiza o estoque subtraindo a quantidade de itens comprados
  var tableBody = document.getElementById('table-body');

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var cells = row.getElementsByTagName('td');

    var produto = cells[0].textContent;
    var quantidade = cells[2].textContent;

    // Atualiza o estoque subtraindo a quantidade comprada
    for (var j = 0; j < data.length; j++) {
      if (data[j].Produto === produto) {
        data[j].Quantidade -= parseFloat(quantidade);
        break;
      }
    }
  }

   // Atualiza os dados no IndexedDB
   var request = indexedDB.open('test');

   request.onsuccess = function(event) {
     var db = event.target.result;
     var transaction = db.transaction(['users'], 'readwrite');
     var objectStore = transaction.objectStore('users');
 
     data.forEach(function(item) {
       var updateRequest = objectStore.put(item);
 
       updateRequest.onsuccess = function() {
         console.log('Dados do estoque atualizados com sucesso!');
       };
     });
   };
}

function updateDateTime(itemId, value) {
  // Encontre o item na tabela do carrinho pelo ID
  var tableBody = document.getElementById('cart-table-body');
  var rows = tableBody.getElementsByTagName('tr');

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var itemIdAttr = row.getAttribute('data-id');

    if (itemIdAttr === itemId) {
      // Atualize a data e hora associada ao item
      row.setAttribute('data-date', value);
      break;
    }
  }
}
