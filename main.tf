terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.0"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# 1. Definisi Network (Menggunakan network yang sudah ada / external)
resource "docker_network" "local_network" {
  name = "global-network-geosandbox"
}

# 2. Build Image berdasarkan Dockerfile local beserta argumennya
resource "docker_image" "app_image" {
  name = "be-geosandbox-gis-service:latest"
  build {
    context    = "."
    dockerfile = "Dockerfile"
    build_arg = {
      NODE_VERSION = "24.16.0"
    }
  }
}

# 3. Definisi Container Aplikasi
resource "docker_container" "app" {
  name    = "gis_service_app"
  image   = docker_image.app_image.image_id
  restart = "always"
  command = ["npm", "run dev"]

  # Batasan RAM (Memory limit 512MB dalam satuan Bytes)
  # 512 * 1024 * 1024 = 536870912
  memory = 536870912

  networks_advanced {
    name = docker_network.local_network.name
  }

  # Sinkronisasi port sesuai Compose (3620:3620)
  ports {
    internal = 3620
    external = 3620
  }

  # Mapping Volume & Anonymous Volume untuk node_modules
  volumes {
    host_path      = abspath(path.module)
    container_path = "/usr/src/app"
  }

  volumes {
    container_path = "/usr/src/app/node_modules"
  }

  # Mengambil environment variable dari file .env secara otomatis
  env = [
    for line in compact(split("\n", file("${path.module}/.env"))) : line 
    if !startswith(line, "#") && length(split("=", line)) > 1
  ]
}
