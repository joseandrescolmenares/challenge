# Guía de Solución de Problemas - SmartHome Hub X1000

## Tabla de Contenidos
1. [Diagnóstico mediante indicadores LED](#diagnóstico-mediante-indicadores-led)
2. [Problemas de Conexión](#problemas-de-conexión)
3. [Dispositivos no detectados](#dispositivos-no-detectados)
4. [Problemas con rutinas automatizadas](#problemas-con-rutinas-automatizadas)
5. [Errores de aplicación](#errores-de-aplicación)
6. [Rendimiento y estabilidad](#rendimiento-y-estabilidad)
7. [Problemas de actualización](#problemas-de-actualización)
8. [Restablecimiento de fábrica](#restablecimiento-de-fábrica)
9. [Soporte técnico avanzado](#soporte-técnico-avanzado)

## Diagnóstico mediante indicadores LED

El SmartHome Hub X1000 utiliza indicadores LED para comunicar su estado. Esta tabla le ayudará a interpretar las diferentes señales:

| Color LED | Patrón | Significado | Acción recomendada |
|-----------|--------|-------------|-------------------|
| Verde | Fijo | Funcionamiento normal | Ninguna acción necesaria |
| Verde | Parpadeante lento | Actividad de red | Comportamiento normal durante transferencia de datos |
| Azul | Fijo | Modo de emparejamiento activo | Proceda a emparejar dispositivos |
| Amarillo | Fijo | Actualización en progreso | No desconecte el dispositivo |
| Amarillo | Parpadeante rápido | Error de actualización | Reinicie el Hub y vuelva a intentar |
| Rojo | Parpadeante lento | Error de conexión a internet | Verifique su conexión a internet |
| Rojo | Parpadeante rápido | Error crítico de sistema | Contacte con soporte técnico |
| Rojo | Fijo | Sobrecalentamiento | Apague y permita enfriamiento. Verifique ventilación |
| Ninguna luz | - | Sin alimentación | Verifique conexión de alimentación |

## Problemas de Conexión

### El Hub no se conecta a WiFi

1. **Verifique credenciales**:
   - Asegúrese de haber introducido correctamente la contraseña de WiFi
   - Verifique que no haya caracteres especiales o espacios que puedan causar problemas

2. **Problemas de señal**:
   - Confirme que su router está funcionando correctamente
   - Verifique que el Hub está dentro del alcance de la señal WiFi
   - Aleje el Hub de fuentes de interferencia (microondas, teléfonos inalámbricos)

3. **Incompatibilidad**:
   - El Hub requiere redes WiFi 2.4GHz para configuración inicial
   - Compruebe que su router no está configurado exclusivamente en 5GHz
   - Verifique que su router soporta WPA2 o WPA3

4. **Reinicio de red**:
   - Reinicie su router (desconecte durante 30 segundos y vuelva a conectar)
   - Espere 2-3 minutos hasta que esté completamente operativo
   - Intente reconectar el Hub

### Desconexiones frecuentes

1. **Interferencia**:
   - Cambie el canal WiFi en su router (canales 1, 6, u 11 suelen tener menos interferencia)
   - Mantenga el Hub a al menos 1 metro de distancia de otros dispositivos electrónicos

2. **Ancho de banda**:
   - Verifique si otros dispositivos están saturando su red
   - Considere usar conexión Ethernet para mayor estabilidad

3. **Actualización de firmware**:
   - Asegúrese de que tanto su router como el Hub tienen el firmware más reciente

### Problemas con el servidor en la nube

Si el Hub está conectado a internet pero no puede acceder a los servicios en la nube:

1. **Estado del servicio**:
   - Verifique el estado actual del servicio en status.smarthomehub.com
   - Los mantenimientos programados se anuncian con 72 horas de antelación

2. **Configuración de red**:
   - Asegúrese de que los puertos requeridos no están bloqueados por su firewall
   - Puertos necesarios: TCP 8883 (MQTT), TCP 443 (HTTPS), UDP 53 (DNS)

3. **Proxy o VPN**:
   - El Hub no es compatible con la mayoría de servidores proxy o VPN
   - Conéctelo directamente a internet sin intermediarios

## Dispositivos no detectados

### Problemas generales de detección

1. **Distancia y obstáculos**:
   - Asegúrese de que el dispositivo está dentro del rango de cobertura
   - Para dispositivos Z-Wave/ZigBee: máximo 10-30 metros en espacios abiertos
   - Paredes, especialmente las metálicas, reducen significativamente el alcance

2. **Modo de emparejamiento**:
   - Confirme que el dispositivo está en modo de emparejamiento
   - Consulte el manual específico del dispositivo para las instrucciones

3. **Capacidad máxima**:
   - Verifique que no ha excedido el límite de dispositivos
   - Límites por protocolo: 232 dispositivos Z-Wave, 128 ZigBee, 50 WiFi, 32 Bluetooth

### Problemas específicos por protocolo

#### Z-Wave

1. **Red saturada**:
   - Ejecute "Optimización de red Z-Wave" desde Configuración > Redes > Z-Wave
   - Considere añadir repetidores Z-Wave en ubicaciones estratégicas

2. **Inclusión fallida**:
   - Excluya el dispositivo antes de intentar incluirlo nuevamente
   - Mantenga el dispositivo a menos de 1 metro del Hub durante la inclusión
   - Realice un "reset de red Z-Wave" como último recurso (requiere reinclusión de todos los dispositivos)

#### ZigBee

1. **Interferencia de canal**:
   - Cambie el canal ZigBee desde Configuración > Redes > ZigBee
   - Evite canales WiFi superpuestos

2. **Dispositivo no compatible**:
   - Verifique la lista de compatibilidad en smarthomehub.com/compatibility
   - Algunos dispositivos ZigBee requieren coordinadores específicos

#### WiFi

1. **DHCP agotado**:
   - Verifique que su router tiene suficientes direcciones IP disponibles
   - Considere ampliar el rango DHCP o usar IP estáticas

2. **Dispositivo fuera de rango de frecuencia**:
   - Asegúrese de que su dispositivo opera en la misma banda que su red (2.4GHz/5GHz)

## Problemas con rutinas automatizadas

### Las rutinas no se ejecutan

1. **Verificar estado**:
   - Compruebe que la rutina está activada (icono de toggle en verde)
   - Verifique que el Hub está conectado a internet para rutinas basadas en tiempo/clima

2. **Disparadores y condiciones**:
   - Revise que los disparadores están configurados correctamente
   - Asegúrese de que todas las condiciones necesarias se cumplen
   - Los dispositivos involucrados deben estar en línea y funcionales

3. **Conflictos entre rutinas**:
   - Verifique si hay rutinas que puedan estar en conflicto
   - Las rutinas se procesan en orden de prioridad (configurable)

### Rutinas inconsistentes

1. **Sincronización horaria**:
   - Verifique que la zona horaria del Hub es correcta
   - Asegúrese de que los ajustes de horario de verano son correctos

2. **Sensores imprecisos**:
   - Calibre los sensores que actúan como disparadores
   - Reubique sensores que puedan estar recibiendo lecturas falsas

3. **Límites de tiempo**:
   - Algunas rutinas tienen un "período de enfriamiento" para evitar activaciones excesivas
   - Verifique los ajustes avanzados de la rutina

## Errores de aplicación

### Códigos de error comunes

| Código | Descripción | Solución |
|--------|-------------|----------|
| E1001 | Error de autenticación | Verifique credenciales o restablezca contraseña |
| E1002 | Sesión expirada | Inicie sesión nuevamente |
| E2001 | Error de conexión al Hub | Verifique que el Hub está encendido y conectado |
| E2002 | Versión incompatible | Actualice la aplicación o el firmware del Hub |
| E3001 | Error al guardar configuración | Verifique permisos de usuario y espacio de almacenamiento |
| E4001 | Límite de API excedido | Reduzca frecuencia de solicitudes o actualice su plan |
| E5001 | Error de servidor | Problema temporal, inténtelo más tarde |

### La aplicación se bloquea o funciona lentamente

1. **Actualizar aplicación**:
   - Asegúrese de tener la última versión de la aplicación
   - Borre caché de la aplicación (Ajustes > Aplicaciones > SmartHome Hub > Almacenamiento > Borrar caché)

2. **Problemas de dispositivo móvil**:
   - Cierre aplicaciones en segundo plano
   - Reinicie su dispositivo móvil
   - Verifique espacio de almacenamiento disponible

3. **Número excesivo de dispositivos**:
   - La visualización de muchos dispositivos simultáneamente puede ralentizar la aplicación
   - Utilice la organización por zonas para mejorar el rendimiento

## Rendimiento y estabilidad

### El Hub funciona lentamente

1. **Sobrecarga de sistema**:
   - Demasiadas rutinas complejas ejecutándose simultáneamente
   - Múltiples integraciones de terceros activas
   - Considere simplificar automatizaciones o distribuirlas en diferentes momentos

2. **Sobrecalentamiento**:
   - Verifique que el Hub tiene ventilación adecuada
   - La temperatura ambiente recomendada es 10-35°C (50-95°F)
   - Limpie las rejillas de ventilación si están obstruidas

3. **Almacenamiento interno**:
   - Verifique espacio disponible en Configuración > Sistema > Almacenamiento
   - Elimine registros antiguos si no son necesarios
   - Considere reducir el nivel de registro en Configuración > Sistema > Registros

### Reinicio aleatorio del sistema

1. **Alimentación inestable**:
   - Utilice el adaptador original proporcionado
   - Conecte el Hub a un sistema de alimentación ininterrumpida (UPS)
   - Evite conectar el Hub a regletas compartidas con dispositivos de alto consumo

2. **Conflictos de software**:
   - Desactive integraciones de terceros una por una para identificar la causa
   - Elimine dispositivos recientemente añadidos para ver si resuelve el problema

## Problemas de actualización

### La actualización falla

1. **Conexión interrumpida**:
   - Asegúrese de tener una conexión estable a internet durante todo el proceso
   - Use preferentemente conexión Ethernet para actualizaciones

2. **Espacio insuficiente**:
   - Libere espacio eliminando registros antiguos o copias de seguridad no necesarias
   - Se requieren al menos 500MB libres para el proceso de actualización

3. **Error de verificación**:
   - Reinicie el Hub e intente nuevamente
   - Si persiste, descargue la actualización manualmente desde smarthomehub.com/firmware

### El Hub no funciona después de actualizar

1. **Actualización incompleta**:
   - Espere 15 minutos; algunos procesos continúan en segundo plano
   - Si el LED permanece rojo durante más de 15 minutos, proceda con recuperación

2. **Recuperación de firmware**:
   - Mantenga presionado el botón de recuperación (orificio pequeño) durante 10 segundos
   - El LED parpadeará en azul indicando modo de recuperación
   - Siga las instrucciones en pantalla o en la aplicación

## Restablecimiento de fábrica

**ADVERTENCIA**: El restablecimiento de fábrica eliminará toda la configuración, dispositivos emparejados, rutinas y registros. Use solo como último recurso.

### Método de botón físico

1. Localice el botón de restablecimiento en la parte posterior del Hub (orificio pequeño)
2. Con el Hub encendido, mantenga presionado el botón durante 15 segundos
3. El LED parpadeará en rojo/verde y luego quedará fijo en azul
4. Suelte el botón; el Hub se reiniciará automáticamente

### Método de software

1. Vaya a Configuración > Sistema > Restablecimiento de fábrica
2. Introduzca su contraseña de administrador
3. Confirme la acción seleccionando "Sí, restablecer"
4. El Hub se reiniciará y comenzará el proceso de configuración inicial

## Soporte técnico avanzado

Si ninguna de las soluciones anteriores resuelve su problema:

### Registros de diagnóstico

1. Vaya a Configuración > Sistema > Diagnóstico
2. Seleccione "Generar informe completo"
3. Guarde el archivo generado
4. Envíe este archivo junto con su solicitud de soporte

### Contacto con soporte técnico

- Email: support@smarthomehub.com
- Teléfono: +1-800-555-SMART (7627)
- Portal de soporte: support.smarthomehub.com
- Horario de atención: Lunes a Viernes, 8AM - 8PM CST

### Información necesaria para soporte

Al contactar con soporte técnico, tenga disponible:
- Número de serie del Hub (en la parte inferior del dispositivo)
- Versión de firmware (Configuración > Sistema > Acerca de)
- Modelo y versión del sistema operativo de su dispositivo móvil
- Descripción detallada del problema, incluyendo cuándo comenzó
- Pasos para reproducir el problema
- Cualquier código de error mostrado
- Captura de pantalla del problema (si aplica) 