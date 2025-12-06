from django.core.management.base import BaseCommand
from places.models import Area

class Command(BaseCommand):
    help = 'Keep only Dublin areas'

    def handle(self, *args, **options):
        dublin_names = [
            'DUBLIN CITY COUNCIL',
            'SOUTH DUBLIN COUNTY COUNCIL',
            'FINGAL COUNTY COUNCIL',
            'DÚNLAOGHAIRE-RATHDOWN COUNTY COUNCIL'
        ]
        
        deleted, _ = Area.objects.exclude(name__in=dublin_names).delete()
        
        self.stdout.write(self.style.SUCCESS(f'✅ Deleted {deleted} areas'))
        self.stdout.write(self.style.SUCCESS(f'✅ Remaining: {Area.objects.count()} Dublin areas'))