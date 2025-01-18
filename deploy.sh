#!/bin/bash

# Variables
APP_NAME="archive-master-api"
DEPLOY_DIR="/var/www/api01-archive-master.kronnos.dev"
BACKUP_DIR="/var/backups/archive-master"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Función de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Función de backup
backup_database() {
    log "Iniciando backup de base de datos..."
    mkdir -p $BACKUP_DIR
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
    
    # Limpiar imágenes no utilizadas
    docker image prune -f
    
    log "Despliegue completado"
}

# Función de rollback
rollback() {
    log "Iniciando rollback..."
    
    # Restaurar backup si existe
    if [ -f "$BACKUP_DIR/backup_$TIMESTAMP.sql" ]; then
        docker exec -i archive_master_db mysql -u archivemaster -p'YAXcB61Kcx16A7FBn34k' archive_master < "$BACKUP_DIR/backup_$TIMESTAMP.sql"
        log "Backup restaurado"
    fi
    
    log "Rollback completado"
}

# Función de limpieza
cleanup() {
    log "Limpiando backups antiguos..."
    find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -exec rm {} \;
}

# Ejecución principal
log "Iniciando proceso de despliegue para $APP_NAME"

# Realizar backup
backup_database

# Intentar despliegue
if deploy; then
    cleanup
    log "Proceso completado exitosamente"
else
    log "Error en el despliegue, iniciando rollback"
    rollback
    exit 1
fi
