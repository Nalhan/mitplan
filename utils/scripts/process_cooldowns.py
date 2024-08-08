import csv
import yaml

def process_csv(input_file, output_file):
    cooldowns = []

    with open(input_file, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            cooldown_parts = row['cooldown'].split(':')
            duration = int(cooldown_parts[0]) * 60 + int(cooldown_parts[1]) + int(cooldown_parts[2]) / 1000
            cooldown = {
                'id': int(row['spellid']),
                'name': row['ability'],
                'duration': duration,
                'color': '#3498db',  # Default color, you may want to randomize or assign based on class
                'icon': row['image'],
                'referenceLink': row['wowhead link'],
                'className': row['class name'],
                'category': row['category']
            }
            cooldowns.append(cooldown)

    with open(output_file, 'w') as yamlfile:
        yaml.dump(cooldowns, yamlfile, default_flow_style=False, sort_keys=False)

# Usage
input_csv = 'input.csv'
output_yaml = 'cooldowns.yaml'
process_csv(input_csv, output_yaml)