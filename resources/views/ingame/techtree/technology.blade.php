<div id="technologytree" data-title="{{ __('t_ingame.techtree.page_title') }} - {{ $object->title }}">
    @include('ingame.techtree.partials.nav', [
        'currentAction' => 'technologies',
        'objectId' => $object->id,
    ])

    <div class="content technologies">
        @foreach ($technology_categories as $categoryTitle => $technologies)
            @if (empty($technologies))
                @continue
            @endif

            <h1 class="technology-category" role="button" tabindex="0" aria-expanded="false">
                {{ __($categoryTitle) }}
            </h1>

            <ul>
                @foreach ($technologies as $technology)
                    @php($technologyObject = $technology['object'])

                    <li class="{{ $technologyObject->class_name }}">
                        <a
                            href="{{ route('techtree.ajax', [
                                'tab' => 2,
                                'object_id' => $technologyObject->id,
                            ]) }}"
                            class="technology sprite_before sprite_tiny {{ $technologyObject->class_name }} overlay"
                            data-overlay-same="true"
                        >
                            {{ $technologyObject->title }}
                        </a>

                        @if (!empty($technology['requirements']))
                            <a
                                href="{{ route('techtree.ajax', [
                                    'tab' => 1,
                                    'object_id' => $technologyObject->id,
                                ]) }}"
                                class="prerequisites overlay"
                                data-overlay-same="true"
                            >
                                @foreach ($technology['requirements'] as $requirement)
                                    <span class="{{ $requirement['fulfilled'] ? 'fulfilled' : 'unfulfilled' }}">
                                        {{ $requirement['object']->title }}
                                        ({{ __('t_ingame.techtree.level') }}
                                        @if ($requirement['fulfilled'])
                                            {{ $requirement['required_level'] }}
                                        @else
                                            {{ $requirement['current_level'] }}/{{ $requirement['required_level'] }}
                                        @endif
                                        )
                                    </span>
                                @endforeach
                            </a>
                        @endif
                    </li>
                @endforeach
            </ul>
        @endforeach
    </div>
</div>

<script type="text/javascript">
    $(function () {
        initOverlayName();

        const $technologyContent = $('#technologytree .content.technologies');
        const $categoryHeadings = $technologyContent.children('.technology-category');
        const $categoryLists = $technologyContent.children('ul');

        function closeCategories() {
            $categoryLists.stop(true, true).hide();
            $categoryHeadings.attr('aria-expanded', 'false');
        }

        function openCategory($heading) {
            $heading
                .attr('aria-expanded', 'true')
                .next('ul')
                .stop(true, true)
                .show();
        }

        closeCategories();

        $categoryHeadings
            .off('.technologyCategories')
            .on('click.technologyCategories keydown.technologyCategories', function (event) {
                if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();

                const $heading = $(this);
                const isOpen = $heading.attr('aria-expanded') === 'true';

                closeCategories();

                if (!isOpen) {
                    openCategory($heading);
                }
            });
    });
</script>
