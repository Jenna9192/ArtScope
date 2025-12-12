import pandas as pd

# read in the medium column
df = pd.read_csv('MetObjects.csv', usecols=['Medium'], low_memory=False)
# find distinct mediums (realize that mediums are listed with , or ' ')
mediums = df['Medium'].dropna().unique()

distinct_mediums = {}

for medium in mediums:
    cleaned = medium.replace(",", " ")

    parts = cleaned.split()

    for p in parts:
        med = p.strip().lower()
        if med in distinct_mediums:
            distinct_mediums[med] += 1
        else:
            distinct_mediums[med] = 1

distinct_mediums = sorted(distinct_mediums.items(), key=lambda x: x[1], reverse=True)
print(f"Number of unique mediums: {len(distinct_mediums)}\n")

print(distinct_mediums[:100])