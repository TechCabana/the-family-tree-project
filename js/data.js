// js/data.js
export const familyData = {
    // We define relationships relative to a "root" person, in this case, ID 7 (Olivia).
    rootMemberId: 7, 
    members: [
        // Paternal Great-Grandparents
        { id: 1, name: "Robert Johnson", relationship: "Great Grandfather", birthDate: "1925-03-15", deathDate: "1995-11-20", location: "New York, USA", occupation: "Carpenter", description: "Served in WWII. Loved woodworking.", tags: ["Military", "Craftsman"], avatar: null, generation: 0, side: "paternal" },
        { id: 2, name: "Mary Brown", relationship: "Great Grandmother", birthDate: "1928-07-22", deathDate: "2005-01-10", location: "Boston, USA", occupation: "Nurse", description: "An avid gardener and a fantastic cook.", tags: ["Healthcare", "Gardening"], avatar: null, generation: 0, side: "paternal" },
        
        // Maternal Great-Grandparents
        { id: 10, name: "George White", relationship: "Great Grandfather", birthDate: "1922-01-10", deathDate: "1999-08-03", location: "London, UK", occupation: "Accountant", description: "Immigrated in 1948. Loved jazz music.", tags: ["Immigrant", "Music"], avatar: null, generation: 0, side: "maternal" },
        { id: 11, name: "Helen Davis", relationship: "Great Grandmother", birthDate: "1926-04-05", deathDate: "2010-12-25", location: "London, UK", occupation: "Librarian", description: "A voracious reader and local historian.", tags: ["Education", "History"], avatar: null, generation: 0, side: "maternal" },

        // Paternal Grandparents
        { id: 3, name: "James Johnson", relationship: "Grandfather", birthDate: "1950-05-10", deathDate: null, location: "Chicago, USA", occupation: "Architect", description: "Designed several community buildings.", tags: ["Artist", "Entrepreneur"], avatar: null, generation: 1, side: "paternal" },
        { id: 4, name: "Patricia Smith", relationship: "Grandmother", birthDate: "1952-09-01", deathDate: null, location: "Chicago, USA", occupation: "Teacher", description: "Taught elementary school for 35 years.", tags: ["Education"], avatar: null, generation: 1, side: "paternal" },
        
        // Maternal Grandparents
        { id: 12, name: "Peter White", relationship: "Grandfather", birthDate: "1951-08-18", deathDate: null, location: "Miami, USA", occupation: "Pilot", description: "Flew for commercial airlines for 40 years.", tags: ["Traveler", "Aviation"], avatar: null, generation: 1, side: "maternal" },
        { id: 13, name: "Susan Clark", relationship: "Grandmother", birthDate: "1955-02-22", deathDate: null, location: "Miami, USA", occupation: "Realtor", description: "A successful real estate agent.", tags: ["Entrepreneur"], avatar: null, generation: 1, side: "maternal" },

        // Parents
        { id: 5, name: "Michael Johnson", relationship: "Father", birthDate: "1978-11-30", deathDate: null, location: "San Francisco, USA", occupation: "Software Engineer", description: "Loves hiking and technology.", tags: ["Tech", "Outdoors"], avatar: "https://i.pravatar.cc/150?u=michael", generation: 2, side: "paternal" },
        { id: 6, name: "Emma White", relationship: "Mother", birthDate: "1980-01-20", deathDate: null, location: "San Francisco, USA", occupation: "Graphic Designer", description: "Creative spirit with a love for painting.", tags: ["Artist", "Traveler"], avatar: "https://i.pravatar.cc/150?u=emma", generation: 2, side: "maternal" },
        
        // Current Generation (Root)
        { id: 7, name: "Olivia Johnson", relationship: "Daughter", birthDate: "2010-06-15", deathDate: null, location: "San Francisco, USA", occupation: "Student", description: "Loves soccer and playing the piano.", tags: ["Music", "Sports"], avatar: null, generation: 3, side: "ego" },
        { id: 8, name: "Leo Johnson", relationship: "Son", birthDate: "2012-09-02", deathDate: null, location: "San Francisco, USA", occupation: "Student", description: "Enjoys building with LEGOs.", tags: ["Creative"], avatar: null, generation: 3, side: "ego" }
    ],
    connections: [
        // Marriages
        { id: 'c1', members: [1, 2], type: 'Spouse', status: 'Married', direct: false, annotation: 'Married for 50 years.' },
        { id: 'c10', members: [10, 11], type: 'Spouse', status: 'Married', direct: false, annotation: 'Met in London after the war.' },
        { id: 'c2', members: [3, 4], type: 'Spouse', status: 'Married', direct: false, annotation: 'Met in college.' },
        { id: 'c12', members: [12, 13], type: 'Spouse', status: 'Divorced', direct: false, annotation: 'Divorced in 2005.' },
        { id: 'c3', members: [5, 6], type: 'Spouse', status: 'Married', direct: true, annotation: 'Married in 2008 in Napa Valley.' },

        // Parent-Child (Direct Lineage)
        { id: 'c4', members: [1, 3], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c5', members: [2, 3], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c6', members: [3, 5], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c7', members: [4, 5], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c8', members: [5, 7], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c9', members: [6, 7], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c15', members: [5, 8], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c16', members: [6, 8], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c11', members: [10, 12], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c12', members: [11, 12], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c13', members: [12, 6], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },
        { id: 'c14', members: [13, 6], type: 'Parent-Child', status: 'Parent', direct: true, annotation: null },

        // Siblings
        { id: 'c17', members: [7, 8], type: 'Sibling', status: 'Sibling', direct: true, annotation: null },
    ]
};