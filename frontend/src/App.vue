<script setup>
async function testMongoConnection() {

  const report = {
    user: {
      user_id: '123',
      username: 'vue.test'
    },

    notes: 'Test desde Vue',

    attachments: [],

    tags: {
      test: true
    },

    report_location: {
      type: 'Point',
      coordinates: [-58.37, -34.60]
    },

    status: 'active',

    is_anonymous: false,

    related_reports: [],

    trust_score: 0.99
  };

  try {

    const response = await fetch('http://localhost:3000/reports', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(report)
    });

    const data = await response.json();

    console.log(data);

    alert('Reporte insertado correctamente');

  } catch (error) {

    console.error(error);

    alert('Error conectando con backend');
  }
}
</script>

<template>
  <div>
    <button @click="testMongoConnection">
      Test Mongo Connection
    </button>
  </div>
</template>