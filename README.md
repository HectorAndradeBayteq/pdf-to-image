# Guía de Desarrollo y Despliegue de Azure Functions con Docker

## Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Crear Proyecto de Azure Function](#crear-proyecto-de-azure-function)
3. [Desarrollo Local](#desarrollo-local)
4. [Trabajar con Docker](#trabajar-con-docker)
5. [Publicación en Azure Container Registry](#publicación-en-azure-container-registry)

## Requisitos Previos

- Azure CLI instalado
- Docker Desktop
- Visual Studio Code
- Azure Functions Core Tools
- Azure Functions extension para VS Code
- NodeJS 20 o superior

## Crear Proyecto de Azure Function

1. Crear nuevo proyecto de Azure Function con soporte para Docker:
```bash
func init --worker-runtime <RUNTIME> --language <LANGUAGE> --docker
func init --worker-runtime node --language typescript --docker
```

2. Crear una nueva función de Azure Function con soporte para Docker:

```bash
func new --name <FUNCTION_NAME> --template "<TEMPLATE_NAME>" --authlevel "<AUTH_LEVEL>"
func new --name ConvertPdfToImages --template "HTTP trigger" --authlevel "anonymous"
```


## Desarrollo Local

### Debug Local Directo

1. Abrir el proyecto en Visual Studio Code
2. Presionar F5 o usar el menú Run > Start Debugging
3. Seleccionar ".NET Core" como entorno
4. La función estará disponible en: `http://localhost:7071/api/MyHttpFunction`

### Debug con Docker Local

1. Construir la imagen Docker:

bash
docker build -t <FUNCTION_PROJECT_NAME> .

2. Ejecutar el contenedor:

bash
docker run -p 7071:7071 <FUNCTION_PROJECT_NAME>


3. Debug con Docker en VS Code:
   - Abrir el archivo `.vscode/launch.json`
   - Agregar configuración para Docker:

   ```json
   {
   "version": "0.2.0",
   "configurations": [
   {
   "name": "Docker: Attach to Node",
   "type": "node",
   "request": "attach",
   "remoteRoot": "/site/wwwroot/dist/src/functions",
   "localRoot": "${workspaceRoot}\\src\\functions",
   "port": 9233,
   "address": "localhost",
   "sourceMaps": true,
   }
   ]
   }
   ```


## Trabajar con Docker

### Dockerfile básico para Azure Functions

```dockerfile
FROM mcr.microsoft.com/azure-functions/dotnet:4.0
ENV AzureWebJobsScriptRoot=/home/site/wwwroot
ENV AzureWebJobsStorage=""
ENV FUNCTIONS_WORKER_RUNTIME=dotnet
COPY bin/Release/net6.0/publish/ /home/site/wwwroot
```


### Comandos Docker útiles

- Construir imagen:

```bash
docker build -t <FUNCTION_PROJECT_NAME> .
```

- Ejecutar contenedor:

```bash
docker run -p 7071:7071 <FUNCTION_PROJECT_NAME>
```
    
- Listar contenedores:

```bash
docker ps
```

- Detener contenedor:

```bash
docker stop <container-id>
```


## Publicación en Azure Container Registry

1. Iniciar sesión en Azure:
```bash
az login
```

2. Crear Azure Container Registry (si no existe):
```bash
az acr create --resource-group <nombre-grupo-recursos> --name <nombre-registro> --sku Basic
```

3. Iniciar sesión en ACR:
```bash
az acr login --name <nombre-registro>
```
4. Construir imagen:
```bash
docker build --tag <nombre-imagen>:<tag> .
docker build --tag azurefunctionsimage:v1.0.0 .
```

4. Etiquetar imagen local:
```bash
docker tag <nombre-imagen>:<tag> <nombre-registro>.azurecr.io/<nombre-imagen>:<tag>
docker tag azurefunctionsimage:v1.0.0 acrbayteq.azurecr.io/azurefunctionsimage:v1.0.0
```

5. Subir imagen al registro:
```bash
docker push <nombre-registro>.azurecr.io/myfunctionapp:latest
```

6. Verificar la publicación:
```bash
az acr repository list --name <nombre-registro> --output table
```


7. Pasos previos para publicar en Azure:
```bash
az upgrade
az extension add --name containerapp --upgrade -y
az provider register --namespace Microsoft.Web 
az provider register --namespace Microsoft.App 
az provider register --namespace Microsoft.OperationalInsights 
```

Crear grupo de recursos (si no existe):
```bash
az group create --name <RESOURCE_GROUP_NAME> --location eastus
```


Crear entorno de ContainerApp (si no existe):
```bash
az containerapp env create --name MyContainerappEnvironment --enable-workload-profiles --resource-group <RESOURCE_GROUP_NAME> --location <LOCATION>
az containerapp env create --name PdfToImageContainerAppEnvironment --enable-workload-profiles --resource-group Bayteq --location eastus
```

Crear cuenta de almacenamiento (si no existe):
```bash
az storage account create --name <STORAGE_NAME> --location <LOCATION> --resource-group <RESOURCE_GROUP_NAME> --sku Standard_LRS

az storage account create --name pdf2imagefunctionstorage --location eastus --resource-group Bayteq --sku Standard_LRS
```

8. Crear ContainerApp:
```bash
az functionapp create --name <APP_NAME> --storage-account <STORAGE_NAME> --environment MyContainerappEnvironment --workload-profile-name "Consumption" --resource-group AzureFunctionsContainers-rg --functions-version 4 --runtime node --image <LOGIN_SERVER>/azurefunctionsimage:v1.0.0 --assign-identity

az functionapp create --name pdf2imagefunctionapp --storage-account pdf2imagefunctionstorage --environment PdfToImageContainerAppEnvironment --workload-profile-name "Consumption" --resource-group Bayteq --functions-version 4 --runtime node --image acrbayteq.azurecr.io/azurefunctionsimage:v1.0.0 --assign-identity
```


## Solución de Problemas Comunes

1. **Error de autenticación en ACR**
   - Habilitar usuario administrador:
```bash
az acr update -n <nombre-registro> --admin-enabled true
```

2. **Error de puertos en uso**
   - Verificar puertos en uso:
```bash
netstat -ano | findstr :8080
```
   - Usar un puerto diferente en el comando docker run:
```bash
docker run -p 8081:80 myfunctionapp:latest
```

3. **Problemas con las variables de entorno**
   - Verificar la configuración en local.settings.json
   - Asegurar que las variables de entorno estén correctamente configuradas en el Dockerfile

## Referencias Útiles

- [Documentación oficial de Azure Functions](https://docs.microsoft.com/es-es/azure/azure-functions/)
- [Docker CLI Reference](https://docs.docker.com/engine/reference/commandline/cli/)
- [Azure Container Registry Documentation](https://docs.microsoft.com/es-es/azure/container-registry/)
