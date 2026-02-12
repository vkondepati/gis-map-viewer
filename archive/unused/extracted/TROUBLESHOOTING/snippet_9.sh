# # Extracted from TROUBLESHOOTING.md (fence #9, lang='bash')
     # Using Python
     python -c "
     import pandas as pd
     df = pd.read_csv('file.csv', encoding='latin-1')
     df.to_csv('file_utf8.csv', encoding='utf-8', index=False)
     "
