<?php

/*
 * This file is part of Sulu.
 *
 * (c) Sulu GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\PageBundle\Tests\Functional\Controller;

use Sulu\Bundle\TestBundle\Testing\SuluTestCase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class ResourcelocatorControllerTest extends SuluTestCase
{
    /**
     * @var KernelBrowser
     */
    protected $client;

    protected function setUp(): void
    {
        $this->purgeDatabase();
        $this->initPhpcr();
        $this->client = $this->createClient(
            [],
            [
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            ]
        );

        $this->documentManager = $this->getContainer()->get('sulu_document_manager.document_manager');
    }

    public function testGenerate()
    {
        $this->client->request('POST', '/api/resourcelocators?action=generate', [
            'parts' => ['test1', 'test2'],
            'locale' => 'en',
            'webspace' => 'sulu_io',
        ]);
        $this->assertHttpStatusCode(200, $this->client->getResponse());
        $response = json_decode($this->client->getResponse()->getContent());
        $this->assertEquals('/test1-test2', $response->resourcelocator);
    }

    public function testGenerateWithParent()
    {
        $homeDocument = $this->documentManager->find('/cmf/sulu_io/contents');

        $this->client->request(
            'POST',
            '/api/pages?parentId=' . $homeDocument->getUuid() . '&webspace=sulu_io&locale=en&action=publish',
            [
                'title' => 'Produkte',
                'template' => 'default',
                'url' => '/products',
            ]
        );
        $parentPage = json_decode($this->client->getResponse()->getContent(), true);

        $this->client->request('POST', '/api/resourcelocators?action=generate', [
            'parentId' => $parentPage['id'],
            'parts' => ['test1', 'test2'],
            'locale' => 'en',
            'webspace' => 'sulu_io',
        ]);
        $this->assertHttpStatusCode(200, $this->client->getResponse());
        $response = json_decode($this->client->getResponse()->getContent());
        $this->assertEquals('/products/test1-test2', $response->resourcelocator);
    }

    public function testGenerateWithConflict()
    {
        $homeDocument = $this->documentManager->find('/cmf/sulu_io/contents');

        $this->client->request(
            'POST',
            '/api/pages?parentId=' . $homeDocument->getUuid() . '&webspace=sulu_io&language=en&action=publish',
            [
                'title' => 'Test',
                'template' => 'default',
                'url' => '/test',
            ]
        );
        $this->assertHttpStatusCode(200, $this->client->getResponse());

        $this->client->request('POST', '/api/resourcelocators?action=generate', [
            'parts' => ['test'],
            'locale' => 'en',
            'webspace' => 'sulu_io',
        ]);
        $this->assertHttpStatusCode(200, $this->client->getResponse());
        $response = json_decode($this->client->getResponse()->getContent());
        $this->assertEquals('/test-1', $response->resourcelocator);
    }
}
