# Manual de Configuración del SmartHome Hub X1000

## Índice de Contenidos
1. [Introducción](#introducción)
2. [Acceso al Panel de Control](#acceso-al-panel-de-control)
3. [Configuración de Perfil de Usuario](#configuración-de-perfil-de-usuario)
4. [Configuración de Red](#configuración-de-red)
5. [Gestión de Dispositivos](#gestión-de-dispositivos)
6. [Creación de Rutinas Automatizadas](#creación-de-rutinas-automatizadas)
7. [Integración con Asistentes de Voz](#integración-con-asistentes-de-voz)
8. [Configuración Avanzada](#configuración-avanzada)
9. [Actualizaciones de Software](#actualizaciones-de-software)

## Introducción

Este manual le guiará a través del proceso completo de configuración de su SmartHome Hub X1000, permitiéndole sacar el máximo provecho de todas sus funcionalidades. El Hub actúa como centro de control para todos los dispositivos inteligentes de su hogar, ofreciendo una interfaz unificada y potentes capacidades de automatización.

## Acceso al Panel de Control

### Acceso a través de la aplicación móvil

1. Abra la aplicación SmartHome Hub Control
2. Inicie sesión con las credenciales establecidas durante la instalación
3. La pantalla principal mostrará un resumen del estado del sistema
4. Pulse sobre el ícono de engranaje en la esquina superior derecha para acceder a la configuración completa

### Acceso a través del navegador web

1. Desde cualquier dispositivo conectado a la misma red que el Hub
2. Abra su navegador e ingrese la dirección IP del Hub o http://smarthomehub.local
3. Inicie sesión con sus credenciales
4. El panel de control web ofrece todas las mismas funcionalidades que la aplicación móvil

## Configuración de Perfil de Usuario

### Gestión de usuarios

El SmartHome Hub X1000 permite crear hasta 10 perfiles de usuario con diferentes niveles de acceso:

| Nivel | Descripción | Capacidades |
|-------|-------------|-------------|
| Administrador | Control total del sistema | Todas las funciones, incluida la configuración del sistema |
| Usuario avanzado | Control de dispositivos y rutinas | Añadir/eliminar dispositivos, crear rutinas, ajustar configuraciones |
| Usuario estándar | Control básico | Control de dispositivos, sin capacidad de configuración |
| Invitado | Acceso limitado | Control limitado a dispositivos específicos |

Para añadir un nuevo usuario:
1. Vaya a Configuración > Usuarios > Añadir usuario
2. Complete el formulario con nombre, email y nivel de acceso
3. El nuevo usuario recibirá un email con instrucciones para establecer su contraseña

## Configuración de Red

### Ajustes de Wi-Fi

Para modificar la configuración de red Wi-Fi:
1. Acceda a Configuración > Red > Wi-Fi
2. Puede modificar:
   - Nombre de red (SSID) a la que se conecta el Hub
   - Contraseña de red
   - Banda de frecuencia preferida (2.4GHz o 5GHz)
   - Canal Wi-Fi (Auto/Manual)

### Configuración Ethernet

Si utiliza conexión por cable:
1. Acceda a Configuración > Red > Ethernet
2. Puede configurar:
   - DHCP (automático) o IP estática
   - Dirección IP, máscara de subred, puerta de enlace y DNS si usa IP estática
   - Velocidad del puerto (Auto/10/100/1000 Mbps)

### Configuración Z-Wave/ZigBee

Para la red de dispositivos inteligentes:
1. Acceda a Configuración > Red > Z-Wave/ZigBee
2. Opciones disponibles:
   - Iniciar/detener red Z-Wave o ZigBee
   - Restablecer controlador Z-Wave/ZigBee
   - Optimizar red (recomendado después de añadir múltiples dispositivos)
   - Modificar canal ZigBee (en caso de interferencia)

## Gestión de Dispositivos

### Añadir nuevos dispositivos

1. Vaya a Dispositivos > Añadir dispositivo
2. Seleccione el tipo de dispositivo a añadir:
   - Wi-Fi
   - Z-Wave
   - ZigBee
   - Bluetooth
   - IR (Infrarrojo)
3. Siga las instrucciones específicas para el protocolo seleccionado
4. Una vez detectado, asigne un nombre y una ubicación al dispositivo

### Organización por zonas

Puede organizar sus dispositivos por zonas para facilitar su gestión:
1. Vaya a Dispositivos > Gestionar zonas
2. Cree nuevas zonas como "Sala", "Cocina", "Dormitorio principal", etc.
3. Arrastre y suelte dispositivos en la zona correspondiente

## Creación de Rutinas Automatizadas

Las rutinas permiten automatizar acciones basadas en condiciones específicas.

### Elementos de una rutina

- **Disparadores**: Eventos que inician la rutina (horario, ubicación, estado de dispositivo, etc.)
- **Condiciones**: Requisitos que deben cumplirse para ejecutar las acciones (opcional)
- **Acciones**: Comandos que se ejecutarán cuando se active la rutina

### Crear una rutina básica

1. Vaya a Automatización > Nueva rutina
2. Seleccione un disparador (por ejemplo, "Al atardecer")
3. Añada condiciones si es necesario (por ejemplo, "Solo si hay alguien en casa")
4. Defina las acciones (por ejemplo, "Encender luces del salón al 50%")
5. Guarde la rutina con un nombre descriptivo

### Rutinas avanzadas

Para rutinas más complejas:
1. Use la opción "Editor avanzado"
2. Combine múltiples disparadores con operadores lógicos (Y/O)
3. Cree secuencias de acciones con intervalos de tiempo
4. Utilice variables del sistema (temperatura exterior, consumo energético, etc.)

## Integración con Asistentes de Voz

El SmartHome Hub X1000 es compatible con los principales asistentes de voz del mercado.

### Amazon Alexa

1. Vaya a Integraciones > Asistentes de voz > Amazon Alexa
2. Siga las instrucciones para vincular su cuenta de Amazon
3. Seleccione los dispositivos que desea controlar con Alexa
4. Ejemplos de comandos disponibles:
   - "Alexa, enciende las luces del salón"
   - "Alexa, establece la temperatura a 22 grados"
   - "Alexa, activa la rutina 'Modo Cine'"

### Google Assistant

1. Vaya a Integraciones > Asistentes de voz > Google Assistant
2. Siga las instrucciones para vincular su cuenta de Google
3. Seleccione los dispositivos que desea controlar con Google
4. Configure los comandos personalizados si lo desea

## Configuración Avanzada

### Seguridad

1. Acceda a Configuración > Seguridad
2. Opciones disponibles:
   - Cambiar contraseña del administrador
   - Configurar autenticación de dos factores
   - Establecer bloqueo automático después de inactividad
   - Configurar notificaciones de acceso no autorizado
   - Definir restricciones de IP

### Copia de seguridad y restauración

1. Vaya a Configuración > Sistema > Copia de seguridad
2. Puede:
   - Crear copia de seguridad manual (configuración, rutinas, usuarios)
   - Configurar copias automáticas (diarias, semanales, mensuales)
   - Restaurar desde una copia previa
   - Exportar/importar configuración

## Actualizaciones de Software

### Actualizaciones automáticas

Por defecto, el sistema está configurado para buscar e instalar actualizaciones automáticamente durante la noche. Para modificar este comportamiento:

1. Vaya a Configuración > Sistema > Actualizaciones
2. Puede establecer:
   - Frecuencia de búsqueda de actualizaciones
   - Horario preferido para instalación
   - Notificaciones antes de actualizar

### Actualizaciones manuales

Para actualizar manualmente:
1. Vaya a Configuración > Sistema > Actualizaciones
2. Pulse "Buscar actualizaciones"
3. Si hay disponibles, seleccione "Instalar ahora"

> **NOTA**: Durante el proceso de actualización (10-15 minutos), el Hub permanecerá en modo de mantenimiento y las funciones automatizadas no estarán disponibles. Los dispositivos conectados seguirán funcionando con su última configuración.

Para consultas específicas sobre configuraciones avanzadas, visite nuestro portal de soporte técnico en support.smarthomehub.com donde encontrará guías detalladas y videos tutoriales. 