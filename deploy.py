import tarfile, os, io, paramiko

project_dir = r'C:\Users\filmm\OneDrive\Documents\web-cookcult'
print('Archiving project...')
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w:gz') as tar:
    for root, dirs, files in os.walk(project_dir):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.git')]
        for f in files:
            if f.endswith('.tar.gz'): continue
            full = os.path.join(root, f)
            arcname = os.path.relpath(full, project_dir)
            tar.add(full, arcname=arcname)
buf.seek(0)
print(f'Archive: {buf.getbuffer().nbytes / (1024*1024):.1f} MB')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('naphon.ddns.net', username='milf', password='123444', timeout=15)

# Clean target
stdin, stdout, stderr = client.exec_command('rm -rf ~/cookcult/*')
stdout.read()

# Upload
print('Uploading...')
sftp = client.open_sftp()
sftp.putfo(buf, '/home/milf/cookcult/deploy.tar.gz')
sftp.close()

# Extract
print('Extracting...')
stdin, stdout, stderr = client.exec_command('cd ~/cookcult && tar -xzf deploy.tar.gz && rm deploy.tar.gz && echo extract_ok')
print(stdout.read().decode().strip())

# Setup env files
print('Setting up env files...')
stdin, stdout, stderr = client.exec_command('cd ~/cookcult && cp .env.docker .env && cp .env.docker .env.local && echo env_ok')
print(stdout.read().decode().strip())

# Build and deploy
print('Building and starting containers...')
stdin, stdout, stderr = client.exec_command('cd ~/cookcult && docker compose up -d --build 2>&1')
out = stdout.read().decode()
err = stderr.read().decode()
if out:
    print(out[-4000:] if len(out) > 4000 else out)
if err:
    print('STDERR:', err[-2000:] if len(err) > 2000 else err)

client.close()
print('Done')
