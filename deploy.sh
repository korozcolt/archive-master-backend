#!/bin/bash

# Variables
APP_NAME="archive-master-api"
DEPLOY_DIR="/var/www/api01-archive-master.kronnos.dev"
BACKUP_DIR="/var/backups/archive-master"
LOG_DIR="$DEPLOY_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Función de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/deploy.log"
}

# Crear directorios necesarios
setup_directories() {
    log "Configurando directorios..."
    mkdir -p $BACKUP_DIR
    mkdir -p $LOG_DIR
    chmod -R 755 $LOG_DIR
    chown -R nestjs:nodejs $LOG_DIR
}

# Función de verificación de salud
check_health() {
    local retries=5
    local wait_time=10
    local endpoint="http://localhost:3000/api/health"

    log "Verificando salud de la aplicación..."
    
    for i in $(seq 1 $retries); do
        if curl -s -f $endpoint > /dev/null; then
            log "Aplicación está funcionando correctamente"
            return 0
        fi
        log "Intento $i de $retries - La aplicación aún no responde, esperando..."
        sleep $wait_time
    done

    log "Error: La aplicación no está respondiendo después de $retries intentos"
    return 1
}

# Función de backup
backup_database() {
    log "Iniciando backup de base de datos..."
    docker exec archive_master_db mysqldump -u archivemaster -p'YAXcB61Kcx16A7FBn34k' archive_master > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
    if [ $? -eq 0 ]; then
        log "Backup completado exitosamente"
    else
        log "Error en el backup de base de datos"
        exit 1
    fi
}

# Función de despliegue
deploy() {
    log "Iniciando despliegue..."
    
    # Pull cambios
    git pull origin master
    
    # Construir y reiniciar contenedores
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    # Verificar salud de la aplicación
    if ! check_health; then
        log "Error: La aplicación no está saludable después del despliegue"
        return 1
    fi
    
    # Limpiar imágenes no utilizadas
    docker image prune -f
    
    log "Despliegue completado exitosamente"
    return 0
}

# Función de rollback
rollback() {
    log "Iniciando rollback..."
    
    # Restaurar backup si existe
    if [ -f "$BACKUP_DIR/backup_$TIMESTAMP.sql" ]; then
        docker exec -i archive_master_db mysql -u archivemaster -p'YAXcB61Kcx16A7FBn34k' archive_master < "$BACKUP_DIR/backup_$TIMESTAMP.sql"
        log "Backup restaurado"
    fi
    
    # Revertir a la imagen anterior
    docker-compose down
    docker-compose up -d --no-build
    
    log "Rollback completado"
}

# Función de limpieza
cleanup() {
    log "Limpiando backups antiguos..."
    find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -exec rm {} \;
    
    # Limpiar logs antiguos
    find $LOG_DIR -name "*.log" -mtime +30 -exec rm {} \;
}

# Función de notificación (puedes implementar con tu sistema de notificaciones preferido)
notify() {
    local status=$1
    local message=$2
    # Implementar sistema de notificaciones (ejemplo: Slack, Email, etc.)
    echo "[NOTIFICATION] $status: $message" >> "$LOG_DIR/notifications.log"
}

# Ejecución principal
log "Iniciando proceso de despliegue para $APP_NAME"

# Configurar directorios
setup_directories

# Realizar backup
backup_database

# Intentar despliegue
if deploy; then
    cleanup
    notify "SUCCESS" "Despliegue completado exitosamente"
    log "Proceso completado exitosamente"
else
    log "Error en el despliegue, iniciando rollback"
    rollback
    notify "ERROR" "Fallo en el despliegue, se realizó rollback"
    exit 1
fi