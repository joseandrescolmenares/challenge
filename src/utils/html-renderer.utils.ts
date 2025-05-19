export function formatDocumentTitle(fileName: string): string {
  const withoutExtension = fileName.replace(/\.md$/, '');
  const withSpaces = withoutExtension.replace(/_/g, ' ');
  return withSpaces
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function renderDocumentPage(title: string, content: string): string {
  const escapedContent = content.replace(/`/g, '\\`');

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
      ${getDocumentStyles()}
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>${title}</h1>
      </header>
      <div id="content"></div>
      <div class="footer">
        <p>SmartHome Hub X1000 - Documentación Técnica</p>
        <a href="/" class="btn btn-primary">Ver todos los documentos</a>
      </div>
    </div>
    <script>
      // Renderizar Markdown a HTML
      document.getElementById('content').innerHTML = marked.parse(\`${escapedContent}\`);
    </script>
  </body>
  </html>
  `;
}

export function renderDocumentsList(documents: string[]): string {
  const documentsList = documents
    .map((doc) => {
      const title = formatDocumentTitle(doc);
      return `<li class="list-group-item">
        <a href="/${doc}" class="d-flex justify-content-between align-items-center">
          <span>${title}</span>
          <span class="badge bg-primary rounded-pill">Ver</span>
        </a>
      </li>`;
    })
    .join('');

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentación SmartHome Hub X1000</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <style>
      ${getIndexStyles()}
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>Documentación SmartHome Hub X1000</h1>
      </header>
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h2 class="h5 mb-0">Documentos disponibles</h2>
            </div>
            <ul class="list-group list-group-flush">
              ${documentsList}
            </ul>
          </div>
        </div>
      </div>
      <div class="footer">
        <p>SmartHome Hub X1000 - Centro de Documentación</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

function getDocumentStyles(): string {
  return `
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 0;
      margin: 0;
      background-color: #f7f9fc;
    }
    .container {
      max-width: 900px;
      margin: 30px auto;
      padding: 30px;
      background-color: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 10px;
    }
    header {
      background-color: #0078d4;
      color: white;
      padding: 15px 0;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    h1 {
      margin: 0;
      padding: 0 20px;
    }
    pre {
      background-color: #f4f6f8;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
    code {
      font-family: Consolas, Monaco, 'Andale Mono', monospace;
      background-color: #f4f6f8;
      padding: 2px 5px;
      border-radius: 3px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    blockquote {
      border-left: 4px solid #0078d4;
      padding-left: 15px;
      color: #555;
      margin: 20px 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
    }
    th {
      background-color: #f4f6f8;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 0.9em;
      color: #777;
    }
  `;
}

function getIndexStyles(): string {
  return `
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 0;
      margin: 0;
      background-color: #f7f9fc;
    }
    .container {
      max-width: 900px;
      margin: 30px auto;
      padding: 30px;
      background-color: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 10px;
    }
    header {
      background-color: #0078d4;
      color: white;
      padding: 20px 0;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    h1 {
      margin: 0;
      padding: 0 20px;
    }
    .list-group-item {
      transition: all 0.2s;
    }
    .list-group-item:hover {
      background-color: #f5f9ff;
      transform: translateY(-2px);
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 0.9em;
      color: #777;
    }
  `;
}
