#!/usr/bin/env python3

import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Database setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.driving_school_platform

# Sample driving schools data
sample_schools = [
    {
        "id": str(uuid.uuid4()),
        "name": "AutoÉcole El Hikmah",
        "address": "Rue Didouche Mourad, Centre-ville",
        "state": "Alger",
        "phone": "+213 21 123 456",
        "email": "contact@elhikmah.dz",
        "description": "École de conduite moderne avec des instructeurs expérimentés. Formation théorique et pratique de qualité.",
        "logo_url": "https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=400&h=300&fit=crop",
        "photos": [
            "https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=400&h=300&fit=crop",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
        ],
        "price": 45000.0,
        "rating": 4.5,
        "total_reviews": 156,
        "manager_id": str(uuid.uuid4()),
        "latitude": 36.7538,
        "longitude": 3.0588,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "AutoÉcole Nour",
        "address": "Boulevard Zighout Youcef",
        "state": "Oran",
        "phone": "+213 41 987 654",
        "email": "info@nour-driving.dz",
        "description": "Formation complète avec véhicules récents. Spécialisée dans la formation des conductrices.",
        "logo_url": "https://images.unsplash.com/photo-1580467263924-eb7a3ea7d8e8?w=400&h=300&fit=crop",
        "photos": [
            "https://images.unsplash.com/photo-1580467263924-eb7a3ea7d8e8?w=400&h=300&fit=crop",
            "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop"
        ],
        "price": 42000.0,
        "rating": 4.2,
        "total_reviews": 89,
        "manager_id": str(uuid.uuid4()),
        "latitude": 35.6969,
        "longitude": -0.6331,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "École de Conduite Cirta",
        "address": "Rue Ben Badis, Nouvelle Ville",
        "state": "Constantine",
        "phone": "+213 31 456 789",
        "email": "cirta@driving-school.dz",
        "description": "Plus de 20 ans d'expérience dans la formation à la conduite. Taux de réussite élevé.",
        "logo_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop",
        "photos": [
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop",
            "https://images.unsplash.com/photo-1586337447565-e19d36bf3d82?w=400&h=300&fit=crop"
        ],
        "price": 38000.0,
        "rating": 4.7,
        "total_reviews": 234,
        "manager_id": str(uuid.uuid4()),
        "latitude": 36.3650,
        "longitude": 6.6147,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "AutoÉcole Aures",
        "address": "Rue Larbi Ben M'hidi",
        "state": "Batna",
        "phone": "+213 33 567 890",
        "email": "contact@aures-auto.dz",
        "description": "Formation adaptée aux conditions de montagne. Instructeurs qualifiés et patients.",
        "logo_url": "https://images.unsplash.com/photo-1549399292-5fe8f1d81acb?w=400&h=300&fit=crop",
        "photos": [
            "https://images.unsplash.com/photo-1549399292-5fe8f1d81acb?w=400&h=300&fit=crop"
        ],
        "price": 35000.0,
        "rating": 4.1,
        "total_reviews": 67,
        "manager_id": str(uuid.uuid4()),
        "latitude": 35.5559,
        "longitude": 6.1740,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "AutoÉcole Tlemcen Elite",
        "address": "Avenue de l'Indépendance",
        "state": "Tlemcen",
        "phone": "+213 43 234 567",
        "email": "elite@tlemcen-driving.dz",
        "description": "École de conduite de luxe avec équipements modernes et service personnalisé.",
        "logo_url": "https://images.unsplash.com/photo-1544651896-7cd3bd7671be?w=400&h=300&fit=crop",
        "photos": [
            "https://images.unsplash.com/photo-1544651896-7cd3bd7671be?w=400&h=300&fit=crop",
            "https://images.unsplash.com/photo-1597149730538-329ba4fd6c95?w=400&h=300&fit=crop"
        ],
        "price": 48000.0,
        "rating": 4.8,
        "total_reviews": 123,
        "manager_id": str(uuid.uuid4()),
        "latitude": 34.8780,
        "longitude": -1.3157,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "AutoÉcole Soummam",
        "address": "Rue Amara Rachid",
        "state": "Béjaïa",
        "phone": "+213 34 345 678",
        "email": "soummam@bejaia-driving.dz",
        "description": "Formation complète avec focus sur la sécurité routière. Cours en kabyle et arabe.",
        "logo_url": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=300&fit=crop",
        "photos": [
            "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=300&fit=crop"
        ],
        "price": 40000.0,
        "rating": 4.3,
        "total_reviews": 98,
        "manager_id": str(uuid.uuid4()),
        "latitude": 36.7525,
        "longitude": 5.0626,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "AutoÉcole Sahara",
        "address": "Rue Ahmed Bey",
        "state": "Ouargla",
        "phone": "+213 29 456 789",
        "email": "sahara@ouargla-auto.dz",
        "description": "Spécialisée dans la conduite en conditions désertiques. Formation adaptée au climat.",
        "logo_url": "https://images.unsplash.com/photo-1548089090-e4f4c2e12fe6?w=400&h=300&fit=crop",
        "photos": [
            "https://images.unsplash.com/photo-1548089090-e4f4c2e12fe6?w=400&h=300&fit=crop"
        ],
        "price": 32000.0,
        "rating": 4.0,
        "total_reviews": 45,
        "manager_id": str(uuid.uuid4()),
        "latitude": 31.9539,
        "longitude": 5.3244,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "AutoÉcole Atlas",
        "address": "Place des Martyrs",
        "state": "Blida",
        "phone": "+213 25 567 890",
        "email": "atlas@blida-driving.dz",
        "description": "École de conduite familiale avec approche personnalisée. Prix abordables.",
        "logo_url": "https://images.unsplash.com/photo-1516971487852-893744044ed6?w=400&h=300&fit=crop",
        "photos": [
            "https://images.unsplash.com/photo-1516971487852-893744044ed6?w=400&h=300&fit=crop",
            "https://images.unsplash.com/photo-1561315552-1e91d8c93e51?w=400&h=300&fit=crop"
        ],
        "price": 36000.0,
        "rating": 4.4,
        "total_reviews": 178,
        "manager_id": str(uuid.uuid4()),
        "latitude": 36.4694,
        "longitude": 2.8283,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "AutoÉcole Sétif Modern",
        "address": "Cité El Bez",
        "state": "Sétif",
        "phone": "+213 36 678 901",
        "email": "modern@setif-auto.dz",
        "description": "Formation moderne avec simulateurs et véhicules électriques. Innovation technologique.",
        "logo_url": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop",
        "photos": [
            "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop"
        ],
        "price": 50000.0,
        "rating": 4.6,
        "total_reviews": 87,
        "manager_id": str(uuid.uuid4()),
        "latitude": 36.1900,
        "longitude": 5.4167,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "AutoÉcole El Watan",
        "address": "Route Nationale 5",
        "state": "Annaba",
        "phone": "+213 38 789 012",
        "email": "elwatan@annaba-driving.dz",
        "description": "Formation complète près de la côte. Spécialisation conduite urbaine et périurbaine.",
        "logo_url": "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=400&h=300&fit=crop",
        "photos": [
            "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=400&h=300&fit=crop"
        ],
        "price": 43000.0,
        "rating": 4.2,
        "total_reviews": 156,
        "manager_id": str(uuid.uuid4()),
        "latitude": 36.9000,
        "longitude": 7.7667,
        "created_at": datetime.utcnow()
    }
]

async def populate_data():
    try:
        # Clear existing driving schools
        await db.driving_schools.delete_many({})
        print("Cleared existing driving schools")
        
        # Insert sample driving schools
        result = await db.driving_schools.insert_many(sample_schools)
        print(f"Inserted {len(result.inserted_ids)} driving schools")
        
        # Verify insertion
        count = await db.driving_schools.count_documents({})
        print(f"Total driving schools in database: {count}")
        
        # Show some sample data
        schools = await db.driving_schools.find({}).limit(3).to_list(length=None)
        print("\nSample schools:")
        for school in schools:
            print(f"- {school['name']} in {school['state']} - {school['price']} DA")
            
    except Exception as e:
        print(f"Error populating data: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(populate_data())