export const familyData = {
    members: [
        { id: 1, name: "Robert Johnson", relationship: "Great Grandfather", status: "Married", birthDate: "1925-03-15", deathDate: "2005-11-20", generation: 0, side: "paternal", tags: ["Military", "Craftsman"], avatar: null, description: "Served in WWII." },
        { id: 2, name: "Mary Brown", relationship: "Great Grandmother", status: "Married", birthDate: "1928-07-22", deathDate: "2008-01-10", generation: 0, side: "paternal", tags: ["Healthcare"], avatar: null, description: "An avid gardener." },
        { id: 3, name: "James Johnson", relationship: "Grandfather", status: "Married", birthDate: "1950-05-10", deathDate: null, generation: 1, side: "paternal", tags: ["Artist"], avatar: null, description: "" },
        { id: 4, name: "Patricia Smith", relationship: "Grandmother", status: "Married", birthDate: "1952-09-30", deathDate: null, generation: 1, side: "paternal", tags: ["Education"], avatar: null, description: "" },
        { id: 5, name: "Michael Johnson", relationship: "Father", status: "Married", birthDate: "1978-01-20", deathDate: null, generation: 2, side: "paternal", tags: ["Tech", "Outdoors"], avatar: null, description: "" },
        { id: 6, name: "Emma White", relationship: "Mother", status: "Married", birthDate: "1980-06-12", deathDate: null, generation: 2, side: "maternal", tags: ["Artist", "Traveler"], avatar: null, description: "" },
        { id: 7, name: "Olivia Johnson", relationship: "Daughter", status: "Single", birthDate: "2009-11-08", deathDate: null, generation: 3, side: "ego", tags: ["Music", "Sports"], avatar: null, description: "" },
        { id: 8, name: "Leo Johnson", relationship: "Son", status: "Single", birthDate: "2012-04-25", deathDate: null, generation: 3, side: "ego", tags: ["Creative"], avatar: null, description: "" }
    ],
    connections: [
        { id: 'c1', members: [1, 2], link: 'Spouse', type: 'Biological', status: 'Married', note: 'Married for 50 years.' },
        { id: 'c2', members: [3, 4], link: 'Spouse', type: 'Biological', status: 'Married', note: 'Met in college.' },
        { id: 'c3', members: [5, 6], link: 'Spouse', type: 'Biological', status: 'Married', note: 'Married in 2008.' },
        { id: 'c4', members: [1, 3], link: 'Parent', type: 'Biological', status: '', note: '' },
        { id: 'c5', members: [2, 3], link: 'Parent', type: 'Biological', status: '', note: '' },
        { id: 'c6', members: [3, 5], link: 'Parent', type: 'Biological', status: '', note: '' },
        { id: 'c7', members: [4, 5], link: 'Parent', type: 'Biological', status: '', note: '' },
        { id: 'c8', members: [5, 7], link: 'Parent', type: 'Biological', status: '', note: '' },
        { id: 'c9', members: [6, 7], link: 'Parent', type: 'Biological', status: '', note: '' },
        { id: 'c15', members: [5, 8], link: 'Parent', type: 'Biological', status: '', note: '' },
        { id: 'c16', members: [6, 8], link: 'Parent', type: 'Biological', status: '', note: '' },
        { id: 'c17', members: [7, 8], link: 'Sibling', type: 'Biological', status: '', note: '' },
    ]
};