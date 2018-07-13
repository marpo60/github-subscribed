const octokit = require('@octokit/rest')()

describe('Github Subscribed', function() {
  it('Load the extension', function() {
    octokit.authenticate({
      type: 'token',
      token: Cypress.env("GITHUB_TOKEN")
    })

    // MDU6SXNzdWUyMzkwMDY1OTI= -> https://github.com/marpo60/github-subscribed/issues/2"
    // MDU6SXNzdWUyNDE5Mzg0NjA= -> https://github.com/marpo60/github-subscribed/issues/3"

    // Clear subscrptions by GraphQL
    octokit.request({
      method: 'POST',
      url: '/graphql',
      query: `mutation { updateSubscription(input: {subscribableId: "MDU6SXNzdWUyMzkwMDY1OTI=", state:UNSUBSCRIBED}) {clientMutationId}}`
    })

    octokit.request({
      method: 'POST',
      url: '/graphql',
      query: `mutation { updateSubscription(input: {subscribableId: "MDU6SXNzdWUyNDE5Mzg0NjA=", state:SUBSCRIBED}) {clientMutationId}}`
    })

    // Clear extension storage
    cy.visit('https://www.github.com/')

    cy.document().then((doc) => {
      doc.dispatchEvent(new Event("clearAll"));
    })

    cy.visit('https://www.github.com/notifications')

    // Login if needed
    cy.location().then((loc) => {
      if (loc.pathname !== "/notifications") {
        cy.get('#login_field').type(Cypress.env("GITHUB_USER_E2E"));
        cy.get('#password').type(Cypress.env("GITHUB_PASS_E2E"));
      }
    })

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/notifications');
    });

    // Test that we are attaching to the form submissions
    cy.get('.js-subscribed').contains('0Subscribed');


    cy.visit("https://github.com/marpo60/github-subscribed/issues/2")

    cy.get(".js-thread-subscribe-form button").click();

    cy.visit('https://www.github.com/notifications')
    cy.get('.js-subscribed').contains('1Subscribed');

    // Test that we are adding to the extension already subscribed items when visiting the issue
    cy.visit("https://github.com/marpo60/github-subscribed/issues/3")

    cy.visit('https://www.github.com/notifications')
    cy.get('.js-subscribed').contains('2Subscribed');
  })
})
