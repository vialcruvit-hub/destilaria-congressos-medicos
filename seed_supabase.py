import json
import os
import sys
import requests

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://yzuzasrpypsjucxrebjg.supabase.co").rstrip("/")
SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY")

if not SECRET_KEY:
    print("Erro: defina a variável de ambiente SUPABASE_SECRET_KEY antes de executar.", file=sys.stderr)
    sys.exit(1)

with open("src/data/congressosFallback.json", encoding="utf-8") as f:
    rows = json.load(f)

payload = [
    {
        "slug": r["slug"],
        "nome": r["nome"],
        "data_inicio": r["data_inicio"],
        "data_fim": r["data_fim"],
        "data_status": r["data_status"],
        "data_observacao": r["data_observacao"],
        "modalidade": r["modalidade"],
        "cidade": r["cidade"],
        "estado_uf": r["estado_uf"],
        "pais": r["pais"],
        "local_formatado": r["local_formatado"],
        "tema_principal": r["tema_principal"],
        "temas": r["temas"],
        "fontes": r["fontes"],
    }
    for r in rows
]

resp = requests.post(
    f"{SUPABASE_URL}/rest/v1/congressos?on_conflict=slug",
    headers={
        "apikey": SECRET_KEY,
        "Authorization": f"Bearer {SECRET_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    json=payload,
    timeout=30,
)

if not resp.ok:
    print(f"Falha ao enviar para o Supabase ({resp.status_code}): {resp.text}", file=sys.stderr)
    sys.exit(1)

print(f"Sucesso: {len(payload)} congressos sincronizados com {SUPABASE_URL}.")
